import { log } from './telemetry.js';
export class DecisionNodeEngine{
  constructor(scene,config){ this.scene=scene; this.cfg=config; this.enabled=!!config.assists?.nodes_enabled; this.lastCheck=0; this.hints=[]; }
  update(time){ if(!this.enabled) return; if(time-this.lastCheck<400) return; this.lastCheck=time; this.clearHints();
    const paint=this._paintRect(); const inside=this.scene.state.players.filter(p=>this._inRect(p.g,paint)).length;
    if(inside>=3){ this._hint('Spacing: abríte (3+ en la pintura)'); log('node_spacing',{playersInside:inside}); }
    const bh=this.scene.state.players[0]; if(bh){ const defN=this.scene._defenders?.[0]; if(defN){ const dx=Math.abs(defN.x-bh.g.x), dy=Math.abs(defN.y-bh.g.y); if(dx<30 && dy<120){ this._hint('Puerta-atrás disponible'); log('node_backdoor',{dx,dy}); } } }
    if(bh){ const def=this.scene._nearestDefenderTo(bh.g.x,bh.g.y); if(def){ const d=Phaser.Math.Distance.Between(def.x,def.y,bh.g.x,bh.g.y); if(d<80){ this._hint('Vino ayuda: buscá tirador abierto'); log('node_help_defense',{d}); } } }
  }
  _paintRect(){ const {width,height}=this.scene.scale; const m=40; return new Phaser.Geom.Rectangle(m+width*0.25,m+height*0.35,width*0.5-2*m,height*0.35-2*m); }
  _inRect(o,r){ return Phaser.Geom.Rectangle.Contains(r,o.x,o.y); }
  _hint(t){ const l=this.scene.add.text(14,100+18*this.hints.length,'💡 '+t,{fontFamily:'Arial',fontSize:14,color:'#ffeb3b'}).setScrollFactor(0); l.setDepth(1000); this.hints.push(l); }
  clearHints(){ this.hints.forEach(h=>h.destroy()); this.hints=[]; }
}