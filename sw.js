/* MVP offline support: app files load without signal; map tiles you have viewed are kept for offline use. */
const APP='mvp-app-v5', TILES='mvp-tiles-v1', MAX_TILES=4000;
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(APP).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==APP&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const isTile=u=>/arcgisonline\.com|opentopomap\.org|tile\.openstreetmap\.org/.test(u);
async function trim(){const c=await caches.open(TILES);const k=await c.keys();for(let i=0;i<k.length-MAX_TILES;i++)await c.delete(k[i])}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=r.url;
  if(isTile(u)){e.respondWith(caches.open(TILES).then(async c=>{const hit=await c.match(r);if(hit)return hit;
    try{const res=await fetch(r);if(res.ok||res.type==='opaque'){c.put(r,res.clone());trim()}return res}catch(x){return new Response('',{status:504})}}));return}
  /* app files: network first (so updates arrive), fall back to cache when offline */
  if(u.endsWith('sa-plants.json'))return; /* stored by the app itself */
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(APP).then(c=>c.put(r,cl))}return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html'))));
});
