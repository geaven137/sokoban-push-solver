import f from"node:fs"
let{MAKEFUN_INPUT_DIR:I="/input",MAKEFUN_OUTPUT_DIR:O="/output"}=process.env
let G="",W=0,D=[],Z=0
function F(s,B){
let P=new Int32Array(G.length).fill(-1),q=[s]
P[s]=s*4
for(let h=0;h<q.length;h++){let c=q[h]
for(let j=0;j<4;j++){let n=c+D[j]
if(P[n]==-1&&G[n]!="#"&&!B.includes(n)){P[n]=c*4+j;q.push(n)}}}
for(Z=0;P[Z]==-1;Z++);
return P
}
function A(s,t,B){
let P=F(s,B)
if(P[t]==-1)return null
let o="",c=t
while(c!=s){let v=P[c];o="rldu"[v&3]+o;c=v>>2}
return o
}
function B(m,g,b,s){
let Q=[[b,-1,0,0,F(s,b)]],V=new Set([b+":"+Z]),h=0,N=0
if(b+""==g+"")return[]
while(h<Q.length){
let n=Q[h],p=n[0],P=n[4],x=h++
if(++N>4e5)return 0
for(let i=0;i<p.length;i++)for(let j=0;j<4;j++){
let y=p[i],t=y+D[j],u=y-D[j]
if(P[u]==-1||m&&!m.has(t)||p.includes(t))continue
let q=[...p];q[i]=t;q.sort((a,c)=>a-c)
let R=F(y,q),k=q+":"+Z
if(V.has(k))continue
V.add(k);Q.push([q,x,y,j,R])
if(q+""==g+""){
let o=[],z=Q.length-1
while(z>0){let d=Q[z];o.push([d[2],d[3]]);z=d[1]}
return o.reverse()
}
}
}
return 0
}
function S(t){
let l=t.replace(/\r/g,"").split("\n")
while(l.length&&!l[l.length-1])l.pop()
let W0=Math.max(0,...l.map(v=>v.length))
W=W0+2
G="#".repeat(W)+l.map(v=>"#"+v.padEnd(W0,"#")+"#").join("")+"#".repeat(W)
D=[1,-1,W,-W]
let s=0,b=[],g=[]
for(let i=0;i<G.length;i++){let c=G[i]
if(c=="@"||c=="+")s=i
if(c=="$"||c=="*")b.push(i)
if(c=="."||c=="*"||c=="+")g.push(i)}
if(!s)return""
let y=s/W|0,e=new Set(),r=[]
for(let i=0;i<G.length;i++){
if(G[i]=="#"||e.has(i)||(i/W|0)==y)continue
let q=[i],o=[],d=0
e.add(i)
for(let h=0;h<q.length;h++){let c=q[h];o.push(c)
for(let j=0;j<4;j++){let n=c+D[j]
if(G[n]=="#")continue
if((n/W|0)==y){d=n;continue}
if(!e.has(n)){e.add(n);q.push(n)}}}
let v=new Set(o),x=b.filter(z=>v.has(z)),w=g.filter(z=>v.has(z))
if(d&&x.length&&x.length==w.length)r.push([v,d,x,w])
}
if(!r.length)r.push([0,s,b,g])
let p=s,o2="",ab=[...b]
for(let[m,d,x,w]of r){
let z=A(p,d,ab)
if(z==null)return""
o2+=z;p=d
let P2=B(m,w,x,p)
if(!P2)return""
for(let[y,j]of P2){
let z2=A(p,y-D[j],ab)
if(z2==null)return""
o2+=z2+"rldu"[j]
ab[ab.indexOf(y)]=y+D[j]
p=y
}
}
return o2.slice(0,65536)
}
for(let n=1;n<6;n++){
let d=O+"/i00"+n
f.mkdirSync(d,{recursive:1})
let s=""
try{s=S(f.readFileSync(I+"/i00"+n+"/level.txt","utf8"))}catch{}
f.writeFileSync(d+"/solution.txt",s)
}
