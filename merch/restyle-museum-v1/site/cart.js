const FREE=299,SHIP=30; // SHIP: placeholder Israel flat rate [לאימות]
const K='peleh_cart';const get=()=>JSON.parse(localStorage.getItem(K)||'[]');
const put=c=>{localStorage.setItem(K,JSON.stringify(c));cnt();draw()};
function cnt(){const n=get().reduce((a,b)=>a+b.q,0);document.querySelectorAll('.cc').forEach(e=>e.textContent=n)}
function add(id,title,price){const s=document.querySelector('input[name=size]:checked');const v=s?s.value:'';const c=get();const f=c.find(x=>x.id==id&&x.v==v);f?f.q++:c.push({id,title,price,v,q:1});put(c);const b=document.getElementById('addbtn');if(b){b.textContent='נוסף לסל ✓';setTimeout(()=>b.textContent='הוספה לסל',1500)}}
function chq(i,d){const c=get();c[i].q+=d;if(c[i].q<1)c.splice(i,1);put(c)}
function draw(){const t=document.getElementById('cart');if(!t)return;const c=get();let s=0;
t.innerHTML=c.length?c.map((x,i)=>{s+=x.q*x.price;return `<div class="line"><div class="n">${x.title}<br><small>${x.v?'מידה '+x.v+' · ':''}₪${x.price}</small></div><div class="qty"><button aria-label="הפחתה" onclick="chq(${i},-1)">−</button><span>${x.q}</span><button aria-label="הוספה" onclick="chq(${i},1)">+</button></div></div>`}).join(''):'<p>הסל ריק.</p>';
const sh=(c.length&&s<FREE)?SHIP:0;document.querySelectorAll('.sub').forEach(e=>e.textContent='₪'+s.toFixed(0));document.querySelectorAll('.ship').forEach(e=>e.textContent=c.length?(sh?'₪'+SHIP:'חינם'):'—');const h=document.getElementById('freehint');if(h)h.textContent=(c.length&&s<FREE)?'עוד ₪'+(FREE-s).toFixed(0)+' למשלוח חינם':'';document.querySelectorAll('.sum').forEach(e=>e.textContent='₪'+(s+sh).toFixed(0))}
document.addEventListener('DOMContentLoaded',()=>{cnt();draw()});
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register(document.querySelector('link[rel=manifest]').href.replace('manifest.webmanifest','sw.js'));
