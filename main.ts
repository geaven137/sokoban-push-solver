import f from"node:fs"
let{MAKEFUN_INPUT_DIR:I="/input",MAKEFUN_OUTPUT_DIR:O="/output"}=process.env
let G="",W=0,D=[],Z=0,Y=-1,E=[]
function F(s,B){let P=new Int32Array(G.length),q=[s];P[s]=s*4+1
for(let h=0;h<q.length;h++){let c=q[h]
for(let j=4;j--;){let n=c+D[j]
if(!P[n]&&G[n]!="#"&&!B.includes(n)&&!E.includes(n)&&(n/W|0)^Y){P[n]=c*4+j+1;q.push(n)}}}
for(Z=0;!P[Z];Z++);return P}
function B(m,g,b,s){let Q=[[b,-1,0,0,F(s,b)]],V={[b+":"+Z]:1},h=0
if(b==g+"")return Q
while(h<Q.length){let n=Q[h],p=n[0],P=n[4],i=h++
if(Q.length>4e5)return null
for(let k=0;k<p.length;k++)for(let j=4;j--;){let y=p[k],t=y+D[j],u=y-D[j]
if(!P[u]||m&&!m[t]||p.includes(t))continue
let q=[...p];q[k]=t;q.sort((a,c)=>a-c)
let R=F(y,q),v=q+":"+Z
if(V[v])continue
V[v]=1;Q.push([q,i,y,j,R])
if(q==g+""){let o=[],z=Q.length-1
while(z>=0)o.push(Q[z]),z=Q[z][1]
return o.reverse()}}}
return null}
function S(t){let l=t.split(/\r?\n/)
W=Math.max(0,...l.map(v=>v.length))+2
G="#".repeat(W)+l.map(v=>"#"+v.padEnd(W-2,"#")+"#").join("")+"#".repeat(W)
D=[1,-1,W,-W]
let s=0,b=[],g=[]
for(let i=0,c;c=G[i];i++){if(c=="@"||c=="+")s=i
if(c=="$"||c=="*")b.push(i)
if(c=="."||c=="*"||c=="+")g.push(i)}
let y=s/W|0,r=[];Y=y
for(let h=y*W;h<y*W+W;h++)if(G[h]!="#")for(let k=4;k-->2;){let u=h+D[k]
if(G[u]=="#")continue
let P=F(u,[])
let x=b.filter(z=>P[z]),w=g.filter(z=>P[z])
if(x.length&&x.length==w.length)r.push([P,x,w])}
Y=-1
if(!r.length)r.push([0,b,g])
let p=s,o2="",ab=[...b]
for(let[m,x,w]of r){E=ab.filter(v=>!x.includes(v))
let C=B(m,w,x,p)
if(!C)return""
for(let k=1;k<C.length;k++){let n=C[k],f=n[2],j=n[3],P=C[k-1][4],t=f-D[j],z=""
if(!P[t])return""
for(let c=t;c-p;){let v=P[c]-1;z="rldu"[v&3]+z;c=v>>2}
o2+=z+"rldu"[j]
ab[ab.indexOf(f)]=f+D[j]
p=f}}
return o2.slice(0,1<<16)}
for(let n=0;++n<6;){let p="/i00"+n,d=O+p
f.mkdirSync(d,{recursive:true})
let s=""
try{s=S(f.readFileSync(I+p+"/level.txt","utf8"))}catch{}
f.writeFileSync(d+"/solution.txt",s)}
