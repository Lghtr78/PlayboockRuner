export class PlaysUI{
  constructor(config, onChange){ this.onChange=onChange; this.plays=config.plays||[]; if(!config.ui?.show_plays_ui) return; this.index=0; this.build(); if(this.onChange) this.onChange(this.index); }
  build(){ const b=document.createElement('div'); b.id='playsUI'; b.style.cssText='position:fixed;left:12px;bottom:12px;display:flex;gap:6px;align-items:center;padding:6px 8px;background:#1b1f24;border:1px solid #333;border-radius:10px;z-index:9999;';
    b.innerHTML=`<button id="pPrev" title="Anterior">◀</button><div id="pText" style="min-width:240px"></div><button id="pNext" title="Siguiente">▶</button>`;
    // Style the navigation buttons: increase padding and font size so they are easier to tap or click.
    // The default sizing made the clickable area quite small, so users sometimes struggled to
    // progress to the next play step.  Enlarging the buttons improves accessibility.
    for (const bt of b.querySelectorAll('button')) {
      bt.style.background = '#374151';
      bt.style.border = 'none';
      bt.style.color = '#fff';
      bt.style.borderRadius = '8px';
      // Increase padding and font size for a larger hit area
      bt.style.padding = '8px 14px';
      bt.style.fontSize = '18px';
      bt.style.cursor = 'pointer';
    }
    document.body.appendChild(b); this.text=b.querySelector('#pText'); b.querySelector('#pPrev').onclick=()=>this.prev(); b.querySelector('#pNext').onclick=()=>this.next(); this.render(); }
  render(){ const play=this.plays[0]; if(!play){ this.text.textContent='Sin jugadas'; return; } const step=play.diagram?.[this.index]||'—'; this.text.textContent=`[${this.index+1}/${play.diagram?.length||1}] ${play.name||'Jugada'}: ${step}`; if(this.onChange) this.onChange(this.index);}
  prev(){ if(this.index>0){ this.index--; this.render(); } }
  next(){ const total=(this.plays[0]?.diagram?.length||1); if(this.index<total-1){ this.index++; this.render(); } }
}