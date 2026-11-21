import{readFileSync as r,writeFileSync as w,mkdirSync as k,existsSync as e}from"node:fs"
let I=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output"
let G=[],W=0,D=[]
function L(d){return d==1?"r":d==-1?"l":d==W?"d":"u"}
function F(s,B){
  let P=new Int32Array(G.length).fill(-1),q=[s]
  P[s]=s
  for(let h=0;h<q.length;h++){let c=q[h]
    for(let d of D){let n=c+d
      if(P[n]==-1&&G[n]!="#"&&!B.includes(n)){P[n]=c;q.push(n)}}}
  return P
}
function A(s,t,B){
  let P=F(s,B)
  if(P[t]==-1)return null
  let o="",c=t
  while(c!=s){let p=P[c];o=L(c-p)+o;c=p}
  return o
}
function K(b,p){
  let P=F(p,b),m=0
  while(P[m]==-1)m++
  return b+":"+m
}
function B(mask,gl,bl,st){
  let Q=[[bl,st,-1,0,0]],V=new Set([K(bl,st)]),h=0,N=0
  if(bl+""==gl+"")return[]
  while(h<Q.length){
    let n=Q[h],b=n[0],p=n[1],x=h++
    if(++N>4e5)return 0
    let P=F(p,b)
    for(let i=0;i<b.length;i++)for(let d of D){
      let f=b[i],t=f+d,s=f-d
      if(P[s]==-1||!mask.has(t)||b.includes(t))continue
      let nb=[...b];nb[i]=t;nb.sort((a,c)=>a-c)
      let kk=K(nb,f)
      if(V.has(kk))continue
      V.add(kk)
      Q.push([nb,f,x,f,d])
      if(nb+""==gl+""){
        let o=[],y=Q.length-1
        while(y>0){let nd=Q[y];o.push([nd[3],nd[4]]);y=nd[2]}
        return o.reverse()
      }
    }
  }
  return 0
}
function S(txt){
  let ls=txt.replace(/\r/g,"").split("\n")
  while(ls.length&&ls[ls.length-1]=="")ls.pop()
  let W0=0
  for(let l of ls)W0=Math.max(W0,l.length)
  W=W0+2
  let H=ls.length+2
  G=new Array(W*H).fill("#")
  D=[1,-1,W,-W]
  let st=0,bx=[],gl=[]
  ls.forEach((l,y)=>{for(let x=0;x<l.length;x++){let c=l[x],i=(y+1)*W+x+1;G[i]=c
    if(c=="@"||c=="+")st=i
    if(c=="$"||c=="*")bx.push(i)
    if(c=="."||c=="*"||c=="+")gl.push(i)}})
  if(!st)return""
  let y0=(st/W)|0,seen=new Set(),rooms=[]
  for(let i=0;i<G.length;i++){
    if(G[i]=="#"||seen.has(i)||((i/W)|0)==y0)continue
    let q=[i],comp=[],door=0
    seen.add(i)
    for(let h=0;h<q.length;h++){let c=q[h];comp.push(c)
      for(let d of D){let n=c+d
        if(G[n]=="#")continue
        if(((n/W)|0)==y0){door=n;continue}
        if(!seen.has(n)){seen.add(n);q.push(n)}}}
    let cs=new Set(comp)
    let rb=bx.filter(x=>cs.has(x)),rg=gl.filter(x=>cs.has(x))
    if(door&&rb.length&&rb.length==rg.length)rooms.push({m:cs,d:door,b:rb,g:rg})
  }
  if(!rooms.length){
    let all=new Set()
    for(let i=0;i<G.length;i++)if(G[i]!="#")all.add(i)
    rooms.push({m:all,d:st,b:bx,g:gl})
  }
  let pl=st,out="",ab=[...bx]
  for(let r of rooms){
    let w=A(pl,r.d,ab)
    if(w==null)return""
    out+=w;pl=r.d
    let b=r.b.slice().sort((a,c)=>a-c),g=r.g.slice().sort((a,c)=>a-c)
    let ps=B(r.m,g,b,pl)
    if(!ps)return""
    for(let[f,d]of ps){
      let w2=A(pl,f-d,ab)
      if(w2==null)return""
      out+=w2+L(d)
      ab[ab.indexOf(f)]=f+d
      pl=f
    }
  }
  return out.slice(0,65536)
}
for(let id of["i001","i002","i003","i004","i005"]){
  let p=I+"/"+id+"/level.txt",o=O+"/"+id
  k(o,{recursive:true})
  let s=""
  if(e(p))s=S(r(p,"utf8"))
  w(o+"/solution.txt",s)
}
