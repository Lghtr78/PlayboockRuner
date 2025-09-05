function hardReload({ reset=false } = {}) {
  try { if (reset) localStorage.removeItem('admin_overrides'); } catch {}
  const tasks = [];
  if ('caches' in window) { tasks.push(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(()=>{})); }
  if ('serviceWorker' in navigator) { tasks.push(navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister()))).catch(()=>{})); }
  Promise.allSettled(tasks).finally(()=>{ const u = new URL(location.href); u.searchParams.set('v', Date.now().toString()); location.href = u.toString(); });
}
function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
ready(()=>{
  document.getElementById('btnHardReload')?.addEventListener('click', ()=> hardReload({reset:false}));
  document.getElementById('btnHardReset')?.addEventListener('click',  ()=> hardReload({reset:true}));
});
export {};