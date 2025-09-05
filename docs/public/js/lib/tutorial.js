import { log } from './telemetry.js';
const KEY='tutorial_seen';
function makeStep(t){ const d=document.createElement('div'); d.className='tstep'; d.innerHTML=`<div class="box">${t}</div>`; return d; }
export function ensureTutorial(config){ if(!config.assists?.tutorial_enabled) return; if(localStorage.getItem(KEY)==='1') return;
 const o=document.createElement('div'); o.id='tutorialOverlay'; o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);color:#fff;z-index:99999;display:flex;align-items:center;justify-content:center;';
 o.innerHTML=`<style>#tutorialOverlay .content{max-width:680px;padding:20px;border:1px solid #333;background:#111;border-radius:12px;}#tutorialOverlay .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;}#tutorialOverlay .box{margin:8px 0;padding:10px;border-radius:8px;background:#1b1f24;border:1px solid #333;}#tutorialOverlay button{background:#2d6cdf;border:none;border-radius:8px;color:white;padding:8px 12px;cursor:pointer;}#tutorialOverlay button.secondary{background:#374151;}</style><div class="content"><h3>Tutorial rápido</h3><div class="steps"></div><div class="actions"><button class="secondary" id="btnSkip">Saltar</button><button id="btnPrev" disabled>Anterior</button><button id="btnNext">Siguiente</button></div></div>`;
 const steps=['Arrastrá un jugador para reposicionarlo.','Tocá otro jugador para pasar la pelota.','Si el área pintada está congestionada, el sistema te sugerirá <b>abrirte</b>.','Usá Pantalla completa y Contraste para mejor visibilidad.'].map(makeStep);
 const box=o.querySelector('.steps'); let i=0; function render(){ box.innerHTML=''; box.appendChild(steps[i]); o.querySelector('#btnPrev').disabled=(i===0); o.querySelector('#btnNext').textContent=(i===steps.length-1)?'Listo':'Siguiente'; }
 o.querySelector('#btnNext').onclick=()=>{ if(i<steps.length-1){ i++; render(); } else { localStorage.setItem(KEY,'1'); log('tutorial_complete'); o.remove(); } };
 o.querySelector('#btnPrev').onclick=()=>{ if(i>0){ i--; render(); } };
 o.querySelector('#btnSkip').onclick=()=>{ localStorage.setItem(KEY,'1'); log('tutorial_skipped'); o.remove(); };
 render(); document.body.appendChild(o);
}
export function resetTutorial(){ localStorage.removeItem(KEY); }