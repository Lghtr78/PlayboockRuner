import { AdminState } from './configLoader.js';
const btnFull = document.getElementById('btnFull');
const btnContrast = document.getElementById('btnContrast');
const rotateHint = document.getElementById('rotateHint');
btnFull?.addEventListener('click', ()=>{ if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else document.exitFullscreen().catch(()=>{}); });
btnContrast?.addEventListener('click', ()=>{
  const o = AdminState.overrides || {}; o.display = o.display || {}; o.players = o.players || {};
  o.display.canvas_background = (o.display.canvas_background === '#0b0f14') ? '#2A2E35' : '#0b0f14';
  o.players.offense_color = '#FFFFFF'; o.players.defense_color = '#000000';
  localStorage.setItem('admin_overrides', JSON.stringify(o)); location.reload();
});
function checkOrientation(){ const p = window.innerHeight > window.innerWidth; if (rotateHint) rotateHint.style.display = p ? 'flex' : 'none'; }
window.addEventListener('resize', checkOrientation); rotateHint?.addEventListener('click', ()=> rotateHint.style.display='none'); checkOrientation();
