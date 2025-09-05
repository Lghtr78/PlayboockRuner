const KEY='telemetry_events';
function _load(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function _save(a){ try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} }
export function log(type,data={}){ if(!window.__TELEMETRY_ENABLED__) return; const a=_load(); a.push({t:Date.now(), type, ...data}); _save(a); }
export function exportCSV(){ const rows=_load(); const headers=Array.from(new Set(rows.flatMap(o=>Object.keys(o)))); const csv=[headers.join(',')].concat(rows.map(r=>headers.map(h=>JSON.stringify(r[h]??'')).join(','))).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='telemetry_'+new Date().toISOString().replace(/[:.]/g,'-')+'.csv'; document.body.appendChild(a); a.click(); a.remove(); }
export function clear(){ localStorage.removeItem(KEY); }