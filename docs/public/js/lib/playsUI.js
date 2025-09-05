export class PlaysUI{
  constructor(config, onChange){ this.onChange=onChange; this.plays=config.plays||[]; if(!config.ui?.show_plays_ui) return; this.index=0; this.build(); if(this.onChange) this.onChange(this.index); }
  build(){ const b=document.createElement('div'); b.id='playsUI'; b.style.cssText='position:fixed;left:12px;bottom:12px;display:flex;gap:6px;align-items:center;padding:6px 8px;background:#1b1f24;border:1px solid #333;border-radius:10px;z-index:9999;';
    b.innerHTML=`<button id="pPrev" title="Anterior">◀</button><div id="pText" style="min-width:240px"></div><button id="pNext" title="Siguiente">▶</button>`;
    for(const bt of b.querySelectorAll('button')){ bt.style.cssText='background:#374151;border:none;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;'; }
    document.body.appendChild(b); this.text=b.querySelector('#pText'); b.querySelector('#pPrev').onclick=()=>this.prev(); b.querySelector('#pNext').onclick=()=>this.next(); this.render(); }
  render(){ const play=this.plays[0]; if(!play){ this.text.textContent='Sin jugadas'; return; } const step=play.diagram?.[this.index]||'—'; this.text.textContent=`[${this.index+1}/${play.diagram?.length||1}] ${play.name||'Jugada'}: ${step}`; if(this.onChange) this.onChange(this.index);}
  prev(){ if(this.index>0){ this.index--; this.render(); } }
  next(){ const total=(this.plays[0]?.diagram?.length||1); if(this.index<total-1){ this.index++; this.render(); } }
}