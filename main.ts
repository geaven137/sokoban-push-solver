import f from"node:fs"
let{MAKEFUN_INPUT_DIR:I="/input",MAKEFUN_OUTPUT_DIR:O="/output"}=process.env
let G="",W=0,D=[],Z=0
function F(s,B){let P=[],q=[s];P[s]=s*4+1
for(let h=0;h<q.length;h++){let c=q[h]
for(let j=4;j--;){let n=c+D[j]
if(!P[n]&&G[n]!="#"&&!B.includes(n)){P[n]=c*4+j+1;q.push(n)}}}
for(Z=0;!P[Z];Z++);return P}
function S(t){let l=t.split(/\r?\n/)
W=Math.max(0,...l.map(v=>v.length))+2
G="#".repeat(W)+l.map(v=>("#"+v).padEnd(W-1,"#")+"#").join("")+"#".repeat(W)
D=[1,-1,W,-W]
let s=0,b=[],g=[]
for(let i=0,c;c=G[i];i++){if(c=="@"||c=="+")s=i
if(c=="$"||c=="*")b.push(i)
if(c=="."||c=="*"||c=="+")g.push(i)}
let y=s/W|0,r=[]
for(let h=y*W;h<y*W+W;h++)if(G[h]!="#")for(let k=4;k-->2;){let u=h+D[k]
if(G[u]=="#")continue
let P=F(u,[h])
let x=b.filter(z=>P[z]),w=g.filter(z=>P[z])
if(x.length&&x.length==w.length)r.push([P,x,w])}
if(!r.length)r.push([0,b,g])
let p=s,o2="",ab=[...b]
for(let[m,x,w]of r){let fx=ab.filter(v=>!x.includes(v))
let Q=[[x,-1,0,0,F(p,[...x,...fx])]],V={[x+":"+Z]:1},h=0,C=null
if(x==w+"")C=Q
L:while(h<Q.length&&!C){let n=Q[h++],d=n[0],P=n[4]
if(Q.length>4e5)break
for(let k=0;k<d.length;k++)for(let j=4;j--;){let y=d[k],t=y+D[j],u=y-D[j]
if(!P[u]||m&&!m[t]||d.includes(t))continue
let q=[...d];q[k]=t;q.sort((a,c)=>a-c)
let R=F(y,[...q,...fx]),v=q+":"+Z
if(V[v])continue
V[v]=1;Q.push([q,h-1,y,j,R])
if(q==w+""){let o=[],z=Q.length-1
while(z>=0)o.unshift(Q[z]),z=Q[z][1]
C=o;break L}}}
if(!C)return""
for(let k=1;k<C.length;k++){let n=C[k],f=n[2],j=n[3],P=C[k-1][4],t=f-D[j],z=""
if(!P[t])return""
for(let c=t;c-p;){let v=P[c]-1;z="rldu"[v&3]+z;c=v>>2}
o2+=z+"rldu"[j]
ab[ab.indexOf(f)]=f+D[j]
p=f}}
return o2.slice(0,1<<16)}
for(let n=0;++n<6;){let p="/i00"+n,d=O+p
f.mkdirSync(d,{recursive:!0})
let s=""
try{s=S(f.readFileSync(I+p+"/level.txt","utf8"))}catch{}
f.writeFileSync(d+"/solution.txt",s)}
