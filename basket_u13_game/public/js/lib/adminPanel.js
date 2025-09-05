import { AdminState } from './configLoader.js';
import { exportCSV, clear as clearTelemetry } from './telemetry.js';

const btn = document.getElementById('btnToggleAdmin');
const panel = document.getElementById('panel-admin');
if (btn && panel) {
  btn.addEventListener('click', () => panel.style.display = panel.style.display === 'none' ? 'block' : 'none');
  document.addEventListener('keydown', (e)=>{ if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='a') btn.click(); });
}

const inputs = {
  bg: document.getElementById('inpBg'),
  lines: document.getElementById('inpLines'),
  off: document.getElementById('inpOff'),
  def: document.getElementById('inpDef'),
  radius: document.getElementById('inpRadius'),
  fps: document.getElementById('inpFps')
};

function loadFromOverrides(){
  const o = AdminState.overrides || {};
  inputs.bg && (inputs.bg.value = o.display?.canvas_background || '');
  inputs.lines && (inputs.lines.value = o.court?.lines_color || '');
  inputs.off && (inputs.off.value = o.players?.offense_color || '');
  inputs.def && (inputs.def.value = o.players?.defense_color || '');
  inputs.radius && (inputs.radius.value = o.players?.radius_px || '');
  inputs.fps && (inputs.fps.value = o.display?.fps_target || '');
  const pc = o.court?.style?.paint_color; const fc = o.court?.style?.floor_color; if(inputs.bg && fc) inputs.bg.value = fc; if(document.getElementById('inpPaint') && pc) document.getElementById('inpPaint').value = pc;
}
document.getElementById('btnApply')?.addEventListener('click', ()=>{
  const o = AdminState.overrides || {}; o.display=o.display||{}; o.court=o.court||{}; o.players=o.players||{};
  if (inputs.bg?.value){ o.display.canvas_background = inputs.bg.value; o.court=o.court||{}; o.court.style=o.court.style||{}; o.court.style.floor_color = inputs.bg.value; }
  if (inputs.fps?.value) o.display.fps_target = parseInt(inputs.fps.value,10);
  if (inputs.lines?.value) o.court.lines_color = inputs.lines.value;
  if (inputs.off?.value) o.players.offense_color = inputs.off.value;
  if (inputs.def?.value) o.players.defense_color = inputs.def.value;
  if (inputs.radius?.value) o.players.radius_px = parseInt(inputs.radius.value,10);
  const inpPaint=document.getElementById('inpPaint'); if(inpPaint?.value){ o.court=o.court||{}; o.court.style=o.court.style||{}; o.court.style.paint_color = inpPaint.value; }
  localStorage.setItem('admin_overrides', JSON.stringify(o)); location.reload();
});
document.getElementById('btnReset')?.addEventListener('click', ()=>{ localStorage.removeItem('admin_overrides'); location.reload(); });

// ---- Sprint 1: toggles & telemetry section ----
(function addSprint1(){
  if (!panel) return;
  const sec = document.createElement('div'); sec.style.marginTop='10px';
  sec.innerHTML = `
    <hr style="border-color:#333;opacity:.4;margin:10px 0">
    <h4 style="margin:0 0 6px 0">Ayudas y telemetría</h4>
    <div class="row">
      <div><label>Ayudas (nodos)</label><input id="inpAssistNodes" type="checkbox"></div>
      <div><label>Telemetría</label><input id="inpTelemetry" type="checkbox"></div>
    </div>
    <div class="row">
      <div><label>Tutorial</label><input id="inpTutorial" type="checkbox"></div>
      <div><label>UI Pizarra</label><input id="inpPlaysUI" type="checkbox"></div>
    </div>
    <div style="margin-top:8px;display:flex;gap:8px;">
      <button id="btnExportCSV">Exportar CSV</button>
      <button id="btnClearTel" class="secondary">Borrar telemetría</button>
    </div>
  `;
  panel.appendChild(sec);

  const o = AdminState.overrides || {}; const get = (p, d)=>p?.split('.').reduce((a,k)=>a?.[k], { ...o }) ?? d;
  const set = (path, val)=>{
    const parts = path.split('.'); let ref = (AdminState.overrides = AdminState.overrides || {});
    for (let i=0;i<parts.length-1;i++){ ref[parts[i]] = ref[parts[i]] || {}; ref = ref[parts[i]]; }
    ref[parts[parts.length-1]] = val;
  };

  const q = id => sec.querySelector('#'+id);
  q('inpAssistNodes').checked = !!get('assists.nodes_enabled', true);
  q('inpTelemetry').checked  = !!get('assists.telemetry_enabled', true);
  q('inpTutorial').checked   = !!get('assists.tutorial_enabled', true);
  q('inpPlaysUI').checked    = !!get('ui.show_plays_ui', true);

  const onToggle = ()=>{ 
    set('assists.nodes_enabled',  q('inpAssistNodes').checked);
    set('assists.telemetry_enabled', q('inpTelemetry').checked);
    set('assists.tutorial_enabled',  q('inpTutorial').checked);
    set('ui.show_plays_ui', q('inpPlaysUI').checked);
    localStorage.setItem('admin_overrides', JSON.stringify(AdminState.overrides));
    location.reload();
  };
  q('inpAssistNodes').onchange = onToggle;
  q('inpTelemetry').onchange = onToggle;
  q('inpTutorial').onchange = onToggle;
  q('inpPlaysUI').onchange = onToggle;

  q('btnExportCSV').onclick = ()=> exportCSV();
  q('btnClearTel').onclick  = ()=> clearTelemetry();
})();
;(()=>{
  const panel=document.getElementById('panel-admin'); if(!panel) return;
  const sec=document.createElement('div'); sec.style.marginTop='10px';
  sec.innerHTML = `
    <hr style="border-color:#333;opacity:.4;margin:10px 0">
    <h4 style="margin:0 0 6px 0">Fondo y overlay</h4>
    <div class="row">
      <div><label>Usar textura de cancha</label><input id="inpCourtTexture" type="checkbox"></div>
      <div><label>Mostrar overlay guía</label><input id="inpOverlayRef" type="checkbox"></div>
    </div>
  `;
  panel.appendChild(sec);
  const o = JSON.parse(localStorage.getItem('admin_overrides')||'{}');
  function get(path, d){ return path.split('.').reduce((a,k)=>a?.[k], o) ?? d; }
  function set(path, val){ const parts=path.split('.'); let ref=o; for(let i=0;i<parts.length-1;i++){ ref[parts[i]] = ref[parts[i]]||{}; ref=ref[parts[i]]; } ref[parts.pop()] = val; }
  const q=id=>sec.querySelector('#'+id);
  q('inpCourtTexture').checked = !!get('court.use_texture', true);
  q('inpOverlayRef').checked  = !!get('overlays.reference.enabled', false);
  function on(){ set('court.use_texture', q('inpCourtTexture').checked); set('overlays.reference.enabled', q('inpOverlayRef').checked); localStorage.setItem('admin_overrides', JSON.stringify(o)); location.reload(); }
  q('inpCourtTexture').onchange = on; q('inpOverlayRef').onchange = on;
})();
;(()=>{
  const panel=document.getElementById('panel-admin'); if(!panel) return;
  const sec=document.createElement('div'); sec.style.marginTop='6px';
  sec.innerHTML = `
    <div class="row">
      <div><label>Dibujar líneas de cancha</label><input id="inpCourtLines" type="checkbox"></div>
    </div>
  `;
  panel.appendChild(sec);
  const o = JSON.parse(localStorage.getItem('admin_overrides')||'{}');
  function get(path, d){ return path.split('.').reduce((a,k)=>a?.[k], o) ?? d; }
  function set(path, val){ const parts=path.split('.'); let ref=o; for(let i=0;i<parts.length-1;i++){ ref[parts[i]] = ref[parts[i]]||{}; ref=ref[parts[i]]; } ref[parts.pop()] = val; }
  const q=id=>sec.querySelector('#'+id);
  q('inpCourtLines').checked = !!get('court.draw_lines', false);
  q('inpCourtLines').onchange = ()=>{ set('court.draw_lines', q('inpCourtLines').checked); localStorage.setItem('admin_overrides', JSON.stringify(o)); location.reload(); };
})();

;(()=>{
  const panel=document.getElementById('panel-admin'); if(!panel) return;
  const sec=document.createElement('div'); sec.style.marginTop='6px';
  sec.innerHTML = `
    <div class="row">
      <div><label>Flechas animadas</label><input id="inpAnimatedArrows" type="checkbox"></div>
    </div>
  `;
  panel.appendChild(sec);
  const o = JSON.parse(localStorage.getItem('admin_overrides')||'{}');
  function get(path, d){ return path.split('.').reduce((a,k)=>a?.[k], o) ?? d; }
  function set(path, val){ const parts=path.split('.'); let ref=o; for(let i=0;i<parts.length-1;i++){ ref[parts[i]] = ref[parts[i]]||{}; ref=ref[parts[i]]; } ref[parts.pop()] = val; }
  const q=id=>sec.querySelector('#'+id);
  q('inpAnimatedArrows').checked = !!get('ui.animated_arrows', true);
  q('inpAnimatedArrows').onchange = ()=>{ set('ui.animated_arrows', q('inpAnimatedArrows').checked); localStorage.setItem('admin_overrides', JSON.stringify(o)); location.reload(); };
})();
