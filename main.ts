// Sokoban push-optimal solver: room decomposition + push-space A*.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIRS = [
  [-1, 0, "u"],
  [1, 0, "d"],
  [0, -1, "l"],
  [0, 1, "r"],
];
const LIMIT = 1000000;

function popcnt(m) {
  let c = 0;
  while (m) {
    c += m & 1;
    m >>= 1;
  }
  return c;
}

// Reverse BFS: min pulls from cell to goal (pull valid iff origin cell and
// player-stand cell are both floor inside the room mask).
function revDist(goal, mask, wall, W, H) {
  const d = new Int32Array(W * H).fill(-1);
  d[goal] = 0;
  const q = [goal];
  for (let qi = 0; qi < q.length; qi++) {
    const x = q[qi];
    const r = (x / W) | 0;
    const c = x % W;
    for (const [dr, dc] of DIRS) {
      const yr = r - dr;
      const yc = c - dc;
      const zr = r + dr;
      const zc = c + dc;
      if (yr < 0 || yr >= H || yc < 0 || yc >= W) continue;
      if (zr < 0 || zr >= H || zc < 0 || zc >= W) continue;
      const y = yr * W + yc;
      const z = zr * W + zc;
      if (!mask[y] || wall[y] || !mask[z] || wall[z]) continue;
      if (d[y] === -1) {
        d[y] = d[x] + 1;
        q.push(y);
      }
    }
  }
  return d;
}

// Shortest walk path (BFS, fixed dir order) avoiding walls and boxes.
function walkPath(from, to, boxSet, wall, W, H) {
  if (from === to) return "";
  const prev = new Int32Array(W * H).fill(-1);
  const prevCh = new Array(W * H);
  prev[from] = from;
  const q = [from];
  for (let qi = 0; qi < q.length; qi++) {
    const x = q[qi];
    const r = (x / W) | 0;
    const c = x % W;
    for (const [dr, dc, ch] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
      const y = nr * W + nc;
      if (prev[y] !== -1 || wall[y] || boxSet[y]) continue;
      prev[y] = x;
      prevCh[y] = ch;
      if (y === to) {
        let s = "";
        let cur = y;
        while (cur !== from) {
          s = prevCh[cur] + s;
          cur = prev[cur];
        }
        return s;
      }
      q.push(y);
    }
  }
  return null;
}

function heapCmp(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}
function heapPush(heap, item) {
  heap.push(item);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heapCmp(heap[p], heap[i]) <= 0) break;
    const t = heap[p];
    heap[p] = heap[i];
    heap[i] = t;
    i = p;
  }
}
function heapPop(heap) {
  const top = heap[0];
  const last = heap.pop();
  if (heap.length) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < heap.length && heapCmp(heap[l], heap[m]) < 0) m = l;
      if (r < heap.length && heapCmp(heap[r], heap[m]) < 0) m = r;
      if (m === i) break;
      const t = heap[m];
      heap[m] = heap[i];
      heap[i] = t;
      i = m;
    }
  }
  return top;
}

// Push-optimal A* for one room. Returns list of pushes or null.
function solveRoom(room, wall, W, H, goalSet) {
  const mask = room.mask;
  const goals = room.goals;
  const door = room.door;
  const n = room.boxes.length;
  const dists = goals.map((g) => revDist(g, mask, wall, W, H));
  const dead = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (!mask[i]) continue;
    let ok = false;
    for (const d of dists) {
      if (d[i] >= 0) {
        ok = true;
        break;
      }
    }
    if (!ok) dead[i] = 1;
  }
  // cost[i][j] = min pulls for box i to reach goal j.
  const cost = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) row.push(dists[j][room.boxes[i]]);
    cost.push(row);
  }
  // Min-matching heuristic via DP over goal subsets.
  function heur(bs) {
    const INF = 1e9;
    const dp = new Array(1 << n).fill(INF);
    dp[0] = 0;
    for (let m = 0; m < (1 << n); m++) {
      if (dp[m] === INF) continue;
      const i = popcnt(m);
      if (i >= n) continue;
      for (let j = 0; j < n; j++) {
        if (m & (1 << j)) continue;
        const c = cost[i][j];
        if (c < 0) continue;
        const nm = m | (1 << j);
        if (dp[nm] > dp[m] + c) dp[nm] = dp[m] + c;
      }
    }
    const v = dp[(1 << n) - 1];
    return v >= INF ? Infinity : v;
  }
  // Flood fill over room mask + door; returns reachable set + min cell.
  function flood(start, bs) {
    const occ = new Uint8Array(W * H);
    for (const b of bs) occ[b] = 1;
    const reach = new Uint8Array(W * H);
    reach[start] = 1;
    const q = [start];
    let min = start;
    for (let qi = 0; qi < q.length; qi++) {
      const x = q[qi];
      if (x < min) min = x;
      const r = (x / W) | 0;
      const c = x % W;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
        const y = nr * W + nc;
        if (reach[y] || wall[y] || occ[y]) continue;
        if (!mask[y] && y !== door) continue;
        reach[y] = 1;
        q.push(y);
      }
    }
    return { reach, min };
  }
  // 2x2 freeze: a 2x2 block of walls/boxes holding a box off-goal.
  function frozen(bs) {
    const occ = new Uint8Array(W * H);
    for (const b of bs) occ[b] = 1;
    const blocked = (r, c) =>
      r < 0 || r >= H || c < 0 || c >= W || wall[r * W + c] || occ[r * W + c];
    for (const b of bs) {
      const r = (b / W) | 0;
      const c = b % W;
      for (let dr = -1; dr <= 0; dr++) {
        for (let dc = -1; dc <= 0; dc++) {
          const r0 = r + dr;
          const c0 = c + dc;
          let all = true;
          let offGoal = false;
          for (let i = 0; i < 2 && all; i++) {
            for (let j = 0; j < 2; j++) {
              const rr = r0 + i;
              const cc = c0 + j;
              if (!blocked(rr, cc)) {
                all = false;
                break;
              }
              if (
                rr >= 0 && rr < H && cc >= 0 && cc < W &&
                occ[rr * W + cc] && !goalSet[rr * W + cc]
              ) {
                offGoal = true;
              }
            }
          }
          if (all && offGoal) return true;
        }
      }
    }
    return false;
  }
  const isGoal = (bs) => bs.every((b) => goalSet[b]);
  const keyOf = (player, bs) => player + "|" + bs.join(",");

  const startBoxes = [...room.boxes].sort((a, b) => a - b);
  const h0 = heur(startBoxes);
  if (!isFinite(h0)) return null;
  const initFlood = flood(door, startBoxes);
  const nodes = [];
  const visited = new Map();
  const heap = [];
  let seq = 0;
  const startKey = keyOf(initFlood.min, startBoxes);
  nodes.push({
    boxes: startBoxes,
    player: initFlood.min,
    g: 0,
    parent: -1,
    from: -1,
    to: -1,
    dv: 0,
    ch: "",
    key: startKey,
  });
  visited.set(startKey, 0);
  heapPush(heap, [h0, seq++, 0]);

  let expansions = 0;
  while (heap.length) {
    const top = heapPop(heap);
    const node = nodes[top[2]];
    if (visited.get(node.key) < node.g) continue;
    if (isGoal(node.boxes)) {
      const pushes = [];
      let cur = node;
      while (cur.parent !== -1) {
        pushes.push({ from: cur.from, to: cur.to, dv: cur.dv, ch: cur.ch });
        cur = nodes[cur.parent];
      }
      pushes.reverse();
      return pushes;
    }
    if (++expansions > LIMIT) return null;
    const { reach } = flood(node.player, node.boxes);
    const occ = new Set(node.boxes);
    for (let bi = 0; bi < n; bi++) {
      const b = node.boxes[bi];
      const br = (b / W) | 0;
      const bc = b % W;
      for (const [dr, dc, ch] of DIRS) {
        const sr = br - dr;
        const sc = bc - dc;
        const tr = br + dr;
        const tc = bc + dc;
        if (sr < 0 || sr >= H || sc < 0 || sc >= W) continue;
        if (tr < 0 || tr >= H || tc < 0 || tc >= W) continue;
        const stand = sr * W + sc;
        const to = tr * W + tc;
        if (!reach[stand]) continue;
        if (!mask[to] || wall[to] || occ.has(to) || dead[to]) continue;
        const nb = [...node.boxes];
        nb[bi] = to;
        nb.sort((a, b) => a - b);
        const fl = flood(b, nb);
        if (frozen(nb)) continue;
        const hh = heur(nb);
        if (!isFinite(hh)) continue;
        const ng = node.g + 1;
        const key = keyOf(fl.min, nb);
        const prevG = visited.get(key);
        if (prevG !== undefined && prevG <= ng) continue;
        visited.set(key, ng);
        nodes.push({
          boxes: nb,
          player: fl.min,
          g: ng,
          parent: top[2],
          from: b,
          to,
          dv: dr * W + dc,
          ch,
          key,
        });
        heapPush(heap, [ng + hh, seq++, nodes.length - 1]);
      }
    }
  }
  return null;
}

function solveLevel(text) {
  const raw = text.split(/\r?\n/);
  while (raw.length && raw[raw.length - 1] === "") raw.pop();
  const H = raw.length;
  if (H === 0) return "";
  let W = 0;
  for (const r of raw) if (r.length > W) W = r.length;
  const N = W * H;
  const wall = new Uint8Array(N);
  const goalSet = new Uint8Array(N);
  const goals = [];
  let boxes = [];
  let player = -1;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const ch = c < raw[r].length ? raw[r][c] : "#";
      const i = r * W + c;
      if (ch === "#") {
        wall[i] = 1;
      } else {
        if (ch === "." || ch === "*" || ch === "+") {
          goals.push(i);
          goalSet[i] = 1;
        }
        if (ch === "$" || ch === "*") boxes.push(i);
        if (ch === "@" || ch === "+") player = i;
      }
    }
  }
  if (player < 0 || boxes.length === 0) return "";
  const boxSet = new Uint8Array(N);
  for (const b of boxes) boxSet[b] = 1;

  // Hallway = row of the player start; all non-wall cells in that row.
  const pr = (player / W) | 0;
  const hallway = new Uint8Array(N);
  for (let c = 0; c < W; c++) {
    const i = pr * W + c;
    if (!wall[i]) hallway[i] = 1;
  }
  // Connected components of non-wall, non-hallway cells = rooms.
  const seen = new Uint8Array(N);
  const rooms = [];
  for (let i = 0; i < N; i++) {
    if (wall[i] || hallway[i] || seen[i]) continue;
    const comp = [];
    const q = [i];
    seen[i] = 1;
    for (let qi = 0; qi < q.length; qi++) {
      const x = q[qi];
      comp.push(x);
      const r = (x / W) | 0;
      const c = x % W;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
        const y = nr * W + nc;
        if (wall[y] || hallway[y] || seen[y]) continue;
        seen[y] = 1;
        q.push(y);
      }
    }
    const mask = new Uint8Array(N);
    const rboxes = [];
    const rgoals = [];
    let door = -1;
    for (const x of comp) {
      mask[x] = 1;
      if (goalSet[x]) rgoals.push(x);
      if (boxSet[x]) rboxes.push(x);
      const r = (x / W) | 0;
      const c = x % W;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
        const y = nr * W + nc;
        if (hallway[y]) door = y;
      }
    }
    if (door >= 0 && rboxes.length > 0 && rboxes.length === rgoals.length) {
      rboxes.sort((a, b) => a - b);
      rooms.push({ mask, boxes: rboxes, goals: rgoals, door });
    }
  }
  // Fallback: no valid rooms -> solve the whole board as one room.
  if (rooms.length === 0) {
    const mask = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (!wall[i]) mask[i] = 1;
    rooms.push({
      mask,
      boxes: [...boxes].sort((a, b) => a - b),
      goals,
      door: player,
    });
  }

  let out = "";
  let cur = player;
  for (const room of rooms) {
    const w = walkPath(cur, room.door, boxSet, wall, W, H);
    if (w === null) return "";
    out += w;
    cur = room.door;
    const pushes = solveRoom(room, wall, W, H, goalSet);
    if (!pushes) return "";
    for (const p of pushes) {
      const stand = p.from - p.dv;
      const w2 = walkPath(cur, stand, boxSet, wall, W, H);
      if (w2 === null) return "";
      out += w2 + p.ch;
      boxSet[p.from] = 0;
      boxSet[p.to] = 1;
      cur = p.from;
    }
  }
  return out.slice(0, 65536);
}

const inputDir = process.env.MAKEFUN_INPUT_DIR || "/input";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
for (const id of ["i001", "i002", "i003", "i004", "i005"]) {
  let sol = "";
  try {
    const text = readFileSync(join(inputDir, id, "level.txt"), "utf8");
    sol = solveLevel(text);
  } catch {
    sol = "";
  }
  try {
    mkdirSync(join(outputDir, id), { recursive: true });
    writeFileSync(join(outputDir, id, "solution.txt"), sol);
  } catch {
    // Output dir unwritable: nothing else to do.
  }
}
