// Netlify Function: checks the admin password and writes to the GitHub data repo.
// Environment variables (Netlify > Site configuration > Environment variables):
// ADMIN_PASSWORD (secret), GH_TOKEN (secret), GH_OWNER, GH_REPO
const res=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function same(a,b){const e=new TextEncoder(),h=async x=>new Uint8Array(await crypto.subtle.digest('SHA-256',e.encode(x)));
const x=await h(a),y=await h(b);let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0}
export default async (req)=>{
  const env=process.env;
  if(req.method!=='POST')return res({error:'Not found'},404);
  if(!env.ADMIN_PASSWORD||!env.GH_TOKEN||!env.GH_OWNER||!env.GH_REPO)return res({error:'Server not configured'},500);
  if(!(await same(req.headers.get('x-admin-password')||'',env.ADMIN_PASSWORD))){await sleep(1500);return res({error:'Wrong password'},401)}
  let b;try{b=await req.json()}catch(e){return res({error:'Bad request'},400)}
  const site='https://'+env.GH_OWNER+'.github.io/'+env.GH_REPO;
  if(b.action==='login')return res({ok:true,site});
  if(b.action!=='put'||!/^(images\/\d{6,14}\.jpg|products\/\d{6,14}\.json)$/.test(b.path||'')||typeof b.content!=='string'||b.content.length>400000)return res({error:'Bad request'},400);
  const url='https://api.github.com/repos/'+env.GH_OWNER+'/'+env.GH_REPO+'/contents/'+b.path;
  const h={Authorization:'Bearer '+env.GH_TOKEN,Accept:'application/vnd.github+json','User-Agent':'item-explore-admin'};
  let sha;const g=await fetch(url,{headers:h});if(g.ok)sha=(await g.json()).sha;
  const r=await fetch(url,{method:'PUT',headers:h,body:JSON.stringify({message:String(b.message||'update').slice(0,100),content:b.content,sha})});
  return r.ok?res({ok:true}):res({error:'GitHub error '+r.status},502)};
export const config={path:'/api'};