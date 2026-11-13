// Phone-facing HTML pages (vote, links, admin). Plain inline CSS/JS, no external requests.
import { TALK, LINKS, ALREADY } from "./polls.js";

export const FAVICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0b0d10"/><rect x="12" y="28" width="40" height="8" rx="4" fill="#ffb020"/></svg>';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// JSON safe to embed in <script>
const js = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

const BASE_CSS = `
:root{--bg:#0b0d10;--fg:#f2f1ee;--mut:#9aa0a6;--amb:#ffb020;--red:#ff4d3d;--card:#16191f;--line:#2a2f38;--ok:#4ade80;
--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box;margin:0}
html,body{background:var(--bg);color:var(--fg)}
body{min-height:100dvh;font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
padding:max(20px,env(safe-area-inset-top)) 16px max(40px,env(safe-area-inset-bottom));display:flex;justify-content:center}
main{width:100%;max-width:520px;display:flex;flex-direction:column;gap:18px}
a{color:inherit}
.brand{font:600 11px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--mut);display:flex;align-items:center;gap:10px}
.brand:before{content:"";flex:none;width:28px;height:4px;border-radius:2px;background:var(--amb)}
h1{font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-.01em}
.sub{color:var(--mut)}
.mono{font-family:var(--mono)}
`;

function page(title, body, extraCss = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0d10"><meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>${esc(title)}</title><style>${BASE_CSS}${extraCss}</style></head><body>${body}</body></html>`;
}

// ---------------------------------------------------------------- links
const LINKS_CSS = `
.links{display:flex;flex-direction:column;gap:10px;list-style:none;padding:0}
.links a{display:block;text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.links a:active{border-color:var(--amb)}
.links b{display:block;font-size:18px}
.links span{display:block;color:var(--mut);font-size:14px;margin-top:2px}
.links i{display:block;font:12px var(--mono);color:var(--amb);margin-top:8px;font-style:normal;word-break:break-all}
.already{font-size:13px;color:var(--mut);border-top:1px solid var(--line);padding-top:14px}
.already b{color:var(--fg);font-weight:600}
`;
function linksHtml() {
  const items = LINKS.map(
    (l) => `<li><a href="${esc(l.u)}" target="_blank" rel="noopener"><b>${esc(l.t)}</b><span>${esc(l.s)}</span><i>${esc(l.u.replace(/^https:\/\//, "").replace(/\/$/, ""))}</i></a></li>`,
  ).join("");
  return `<div class="brand">${esc(TALK.title)}</div><h1>Thanks! Where to go next</h1>
<ul class="links">${items}</ul>
<p class="already"><b>Already working on this:</b> ${ALREADY.map(esc).join(" · ")}</p>`;
}
export function linksPage() {
  return page(`Links · ${TALK.title}`, `<main>${linksHtml()}</main>`, LINKS_CSS);
}

// ---------------------------------------------------------------- vote (SPA)
const VOTE_CSS = `
.step{display:flex;align-items:center;justify-content:space-between;font:600 13px var(--mono);color:var(--amb)}
.dots{display:flex;gap:6px}.dot{width:8px;height:8px;border-radius:50%;background:var(--line)}
.dot.done{background:var(--amb)}.dot.cur{background:var(--fg)}
.opts{display:flex;flex-direction:column;gap:10px}
button.o{all:unset;box-sizing:border-box;width:100%;padding:16px;border-radius:14px;background:var(--card);
border:2px solid var(--line);font-size:18px;font-weight:600;line-height:1.3;cursor:pointer;display:flex;gap:12px;
justify-content:space-between;align-items:center;-webkit-tap-highlight-color:transparent;transition:border-color .15s,background .15s}
button.o:active{transform:scale(.99)}
button.o.sel{border-color:var(--amb);background:#2a2110}
button.o .tick{opacity:0;color:var(--amb);font-weight:800;flex:none}
button.o.sel .tick{opacity:1}
button.o[disabled]{opacity:.55;cursor:default}
.msg{color:var(--mut);font-size:15px;min-height:1.5em}
.msg.ok{color:var(--ok)}.msg.err{color:var(--red)}
.nav{display:flex;justify-content:space-between}
.nav button{all:unset;cursor:pointer;color:var(--mut);font-size:15px;padding:6px 0}
.wait{display:flex;flex-direction:column;gap:14px;padding-top:12vh}
.pulse{width:14px;height:14px;border-radius:50%;background:var(--amb);animation:p 1.6s ease-in-out infinite}
@keyframes p{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
.summary{display:flex;flex-direction:column;gap:8px}
.summary button{all:unset;cursor:pointer;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.summary small{display:block;color:var(--mut);font-size:13px}
.net{position:fixed;left:0;right:0;bottom:max(10px,env(safe-area-inset-bottom));text-align:center;color:var(--mut);font-size:13px;pointer-events:none}
${LINKS_CSS}`;

const VOTE_JS = `
(function(){
var app=document.getElementById("app"),net=document.getElementById("net");
var S=window.__S,LINKS_HTML=window.__LINKS,view=null,busy=false,timer=null,fails=0;
function lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var vid=lsGet("sl5:vid");
function vkey(){return "sl5:v:"+S.run+":"+S.epoch}
var mine=lsGet(vkey())||{};
function hello(){return fetch("/api/hello",{method:"POST"}).then(function(r){return r.json()}).then(function(d){if(!d.vid)throw d;vid=d.vid;lsSet("sl5:vid",vid);return vid})}
function apply(ns){
  var reset=ns.run!==S.run||ns.epoch!==S.epoch, moved=ns.mode!==S.mode||ns.grp!==S.grp;
  S=ns; if(reset)mine=lsGet(vkey())||{}; if(reset||moved)view=null; render();
}
function polls(){return S.polls||[]}
function find(id){return polls().filter(function(p){return p.id===id})[0]}
function nextOpen(after){
  var ps=polls(),i0=0;
  if(after){for(var i=0;i<ps.length;i++)if(ps[i].id===after)i0=i+1}
  for(var j=i0;j<ps.length;j++)if(ps[j].open&&mine[ps[j].id]===undefined)return ps[j];
  for(var k=0;k<ps.length;k++)if(ps[k].open&&mine[ps[k].id]===undefined)return ps[k];
  return null;
}
function render(){
  if(S.mode==="links"){app.innerHTML=LINKS_HTML;return}
  if(S.mode!=="poll"){
    app.innerHTML='<div class="brand">'+esc(window.__T)+'</div><div class="wait"><div class="pulse"></div><h1>Keep this page open.</h1><p class="sub">Questions show up here when it\\'s time to vote.</p></div>';
    return;
  }
  if(view===null||(view!=="done"&&!find(view))){var n=nextOpen();view=n?n.id:(polls().length===1?polls()[0].id:"done")}
  if(view==="done")return renderDone();
  renderPoll(find(view));
}
function header(p){
  var ps=polls(),h='<div class="brand">'+esc(window.__T)+'</div>';
  if(ps.length>1){
    var idx=ps.indexOf(p),dots="";
    ps.forEach(function(q,i){dots+='<span class="dot'+(i===idx?" cur":mine[q.id]!==undefined?" done":"")+'"></span>'});
    h+='<div class="step"><span>Question '+(idx+1)+' of '+ps.length+'</span><span class="dots">'+dots+'</span></div>';
  }
  return h;
}
function renderPoll(p){
  var sel=mine[p.id],ps=polls(),idx=ps.indexOf(p);
  var opts=p.o.map(function(o,i){return '<button class="o'+(sel===i?" sel":"")+'" data-i="'+i+'"'+(p.open?"":" disabled")+'><span>'+esc(o)+'</span><span class="tick">✓</span></button>'}).join("");
  var msg=!p.open?(sel!==undefined?"Voting closed. Your answer is in.":"Voting closed."):(sel!==undefined?"Counted. Tap another to change it.":"Tap to vote. You can change your answer.");
  var nav="";
  if(ps.length>1){
    nav='<div class="nav"><button data-go="'+(idx>0?ps[idx-1].id:"")+'"'+(idx>0?"":" style=visibility:hidden")+'>‹ Back</button>'+
      '<button data-go="'+(idx<ps.length-1?ps[idx+1].id:"done")+'">'+(idx<ps.length-1?"Next ›":"Done ›")+'</button></div>';
  }
  app.innerHTML=header(p)+'<h1>'+esc(p.q)+'</h1><div class="opts">'+opts+'</div><p class="msg" id="msg">'+msg+'</p>'+nav;
  bind();
  app.querySelectorAll("button.o").forEach(function(b){b.onclick=function(){cast(p,+b.dataset.i,b)}});
}
function renderDone(){
  var rows=polls().map(function(p){var a=mine[p.id];return '<button data-go="'+p.id+'"><small>'+esc(p.q)+'</small>'+(a!==undefined?esc(p.o[a]):'<span class="sub">Not answered'+(p.open?' (tap to vote)':'')+'</span>')+'</button>'}).join("");
  app.innerHTML='<div class="brand">'+esc(window.__T)+'</div><h1>Thanks! Eyes on the screen 👀</h1><p class="sub">Tap an answer to change it while voting is open.</p><div class="summary">'+rows+'</div>';
  bind();
}
function bind(){app.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){if(b.dataset.go){view=b.dataset.go;render();scrollTo(0,0)}}})}
function cast(p,i,btn){
  if(busy||!p.open)return; busy=true;
  var msg=document.getElementById("msg");
  app.querySelectorAll("button.o").forEach(function(x){x.classList.toggle("sel",x===btn)});
  msg.className="msg";msg.textContent="Sending…";
  (vid?Promise.resolve(vid):hello()).then(function(){return post(p.id,i)}).then(function(r){
    if(r.status===401){return hello().then(function(){return post(p.id,i)})}return r;
  }).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})}).then(function(x){
    busy=false;
    if(x.ok){
      mine[p.id]=i;lsSet(vkey(),mine);msg.className="msg ok";
      var ps=polls();
      if(ps.length>1){msg.textContent="✓ Counted";setTimeout(function(){if(view!==p.id)return;var n=nextOpen(p.id);view=n?n.id:"done";render();scrollTo(0,0)},700)}
      else msg.textContent="✓ Counted. Eyes on the screen 👀";
    }else{
      if(mine[p.id]!==undefined)app.querySelectorAll("button.o").forEach(function(x,k){x.classList.toggle("sel",k===mine[p.id])});
      else btn.classList.remove("sel");
      msg.className="msg err";
      msg.textContent=x.d.error==="closed"?"Voting is closed.":"Couldn't send your vote. Try again.";
      if(x.d.error==="closed")tick();
    }
  }).catch(function(){busy=false;btn.classList.remove("sel");msg.className="msg err";msg.textContent="No connection. Try again."});
}
function post(id,i){return fetch("/api/vote/"+encodeURIComponent(id),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({opt:i,vid:vid})})}
function tick(){
  clearTimeout(timer);
  if(document.hidden)return;
  fetch("/api/state",{cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(ns){
    fails=0;net.textContent="";
    if(ns.rev!==S.rev||ns.run!==S.run||ns.epoch!==S.epoch)apply(ns);else S.poll_ms=ns.poll_ms;
  }).catch(function(){fails++;if(fails>1)net.textContent="Reconnecting…"}).then(schedule);
}
function schedule(){
  clearTimeout(timer);
  var ms=S.mode==="links"?30000:(S.poll_ms||5000);
  ms=ms*(0.85+Math.random()*0.3);
  if(fails)ms=Math.min(ms*(1+fails),20000);
  timer=setTimeout(tick,ms);
}
document.addEventListener("visibilitychange",function(){if(!document.hidden)tick()});
render();schedule();
if(!vid)hello().catch(function(){});
})();`;

export function votePage(state) {
  return page(
    `Vote · ${TALK.title}`,
    `<main id="app"></main><p class="net" id="net"></p>
<script>window.__S=${js(state)};window.__T=${js(TALK.title)};window.__LINKS=${js(linksHtml())};</script>
<script>${VOTE_JS}</script>`,
    VOTE_CSS,
  );
}

// ---------------------------------------------------------------- admin
const ADMIN_CSS = `
main{max-width:640px}
h2{font-size:14px;font:600 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--mut);margin-top:6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
button,input,select{font:inherit;color:inherit}
button{background:#222731;border:1px solid var(--line);border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:600}
button:active{transform:scale(.98)}
button.on{background:var(--amb);color:#111;border-color:var(--amb)}
button.danger{border-color:var(--red);color:var(--red)}
input{background:#0f1216;border:1px solid var(--line);border-radius:10px;padding:10px;min-width:0}
.badge{font:700 12px var(--mono);padding:4px 8px;border-radius:6px;background:var(--amb);color:#111}
.badge.live{background:var(--red);color:#fff}
.big{font-size:22px;font-weight:800}
.poll .q{font-weight:700}
.bar{display:flex;align-items:center;gap:8px;font-size:13px}
.bar span:first-child{flex:1;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar i{display:block;height:8px;background:var(--amb);border-radius:4px}
.bar .w{width:90px;background:#0f1216;border-radius:4px}
.bar b{width:28px;text-align:right}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:6px 4px;border-top:1px solid var(--line)}
.err{color:var(--red)}.ok{color:var(--ok)}
ol{padding-left:20px;color:var(--mut);font-size:14px;display:flex;flex-direction:column;gap:4px}
`;

const ADMIN_JS = `
(function(){
var $=function(s){return document.querySelector(s)},app=$("#app"),T=localStorage.getItem("sl5:admin")||"",timer=null,last=null;
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function api(path,body){return fetch("/api/admin/"+path,{method:body?"POST":"GET",headers:{"authorization":"Bearer "+T,"content-type":"application/json"},body:body?JSON.stringify(body):undefined}).then(function(r){if(r.status===401){logout();throw new Error("unauthorized")}return r.json()})}
function login(){
  app.innerHTML='<div class="brand">SL5 talk · admin</div><h1>Admin</h1><div class="card"><input id="tok" type="password" placeholder="Admin token" autocomplete="current-password"><button id="go">Sign in</button><p id="e" class="err"></p></div>';
  $("#go").onclick=function(){T=$("#tok").value.trim();api("status").then(function(d){localStorage.setItem("sl5:admin",T);draw(d);loop()}).catch(function(e){$("#e").textContent=e.message})};
}
function logout(){T="";localStorage.removeItem("sl5:admin");clearTimeout(timer);login()}
function act(path,body,confirmMsg){if(confirmMsg&&!confirm(confirmMsg))return;api(path,body).then(function(d){if(d.error)alert(d.error);refresh()}).catch(function(e){alert(e.message)})}
function refresh(){return api("status").then(draw).catch(function(){})}
function loop(){clearTimeout(timer);timer=setTimeout(function(){(document.hidden?Promise.resolve():refresh()).then(loop)},3000)}
function draw(d){
  last=d;var s=d.state,run=d.runs.filter(function(r){return r.id===s.run})[0]||{kind:"?",label:""};
  var cur=["idle"].concat(Object.keys(d.groups)).concat(["links"]).map(function(c){return '<button class="'+(s.current===c?"on":"")+'" data-cur="'+c+'">'+c+'</button>'}).join("");
  var polls=d.polls.map(function(p){
    var tot=p.counts.reduce(function(a,b){return a+b},0),mx=Math.max(1,Math.max.apply(null,p.counts));
    var bars=p.o.map(function(o,i){return '<div class="bar"><span>'+esc(o)+'</span><span class="w"><i style="width:'+(100*p.counts[i]/mx)+'%"></i></span><b>'+p.counts[i]+'</b></div>'}).join("");
    return '<div class="card poll"><div class="row"><span class="q">'+esc(p.id)+' · '+esc(p.short)+'</span></div>'+bars+
      '<div class="row"><span class="sub">'+tot+(tot===1?' vote':' votes')+'</span><button class="'+(p.open?"on":"")+'" data-open="'+p.id+'" data-v="'+(p.open?0:1)+'">'+(p.open?"Open: close it":"Closed: open it")+'</button><button class="danger" data-reset="'+p.id+'">Reset</button></div></div>';
  }).join("");
  var runs=d.runs.map(function(r){return '<tr><td>#'+r.id+'</td><td><span class="badge'+(r.kind==="live"?" live":"")+'">'+r.kind+'</span></td><td>'+esc(r.label)+'</td><td>'+r.votes+' votes</td><td>'+(r.id===s.run?"<b>active</b>":'<button data-act="'+r.id+'">activate</button>')+'</td></tr>'}).join("");
  app.innerHTML='<div class="brand">SL5 talk · admin</div>'+
    '<div class="card"><div class="row"><span class="badge'+(run.kind==="live"?" live":"")+'">'+(run.kind||"").toUpperCase()+' #'+s.run+'</span><span>'+esc(run.label||"")+'</span></div>'+
    '<div class="row"><span class="big">'+d.voters+'</span><span class="sub">phones voted in this run · rev '+s.rev+'</span></div></div>'+
    '<h2>Current (what phones show)</h2><div class="row">'+cur+'</div>'+
    '<h2>Polls</h2>'+polls+
    '<h2>Runs</h2><div class="card"><div class="row"><input id="lbl" placeholder="label (optional)" style="flex:1"><button data-run="rehearsal">New rehearsal run</button><button class="danger" data-run="live">New LIVE run</button></div><table>'+runs+'</table></div>'+
    '<h2>Config</h2><div class="card"><div class="row"><label>poll ms <input id="pm" type="number" value="'+s.poll_ms+'" style="width:100px"></label><button id="cfg">Save</button></div>'+
    '<div class="row"><button id="csv">Export CSV (active run)</button><button class="danger" id="rall">Reset all votes in run</button><button id="out">Sign out</button></div></div>'+
    '<h2>Pre-talk checklist</h2><ol><li>New LIVE run (all counts start at 0).</li><li>Check: 0 votes, all polls closed.</li><li>Current → warm.</li><li>Show S0. Watch the counter move.</li></ol>';
  app.querySelectorAll("[data-cur]").forEach(function(b){b.onclick=function(){act("current",{current:b.dataset.cur})}});
  app.querySelectorAll("[data-open]").forEach(function(b){b.onclick=function(){act("open",{ids:[b.dataset.open],open:b.dataset.v==="1"})}});
  app.querySelectorAll("[data-reset]").forEach(function(b){b.onclick=function(){act("reset",{poll:b.dataset.reset},"Delete all votes for "+b.dataset.reset+" in this run?")}});
  app.querySelectorAll("[data-act]").forEach(function(b){b.onclick=function(){act("activate",{run:+b.dataset.act},"Switch active run to #"+b.dataset.act+"?")}});
  app.querySelectorAll("[data-run]").forEach(function(b){b.onclick=function(){
    var k=b.dataset.run;if(k==="live"&&prompt("Type LIVE to start a new live run (counts start at 0)")!=="LIVE")return;
    act("run",{kind:k,label:$("#lbl").value})}});
  $("#cfg").onclick=function(){act("config",{poll_ms:+$("#pm").value})};
  $("#rall").onclick=function(){act("reset",{},"Delete ALL votes in run #"+s.run+"?")};
  $("#out").onclick=logout;
  $("#csv").onclick=function(){fetch("/api/admin/export.csv",{headers:{authorization:"Bearer "+T}}).then(function(r){return r.blob()}).then(function(b){var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="sl5-votes-run"+s.run+".csv";a.click()})};
}
document.addEventListener("visibilitychange",function(){if(!document.hidden&&T)refresh()});
if(T)refresh().then(function(){if(!last)login();else loop()});else login();
})();`;

export function adminPage() {
  return page("Admin · SL5 talk", `<main id="app"></main><script>${ADMIN_JS}</script>`, ADMIN_CSS);
}
