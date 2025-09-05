export class ArrowsEngine{
  constructor(scene, config){
    this.scene = scene;
    this.config = config;
    this.enabled = !!config.ui?.animated_arrows;
    this.phase = 0;
    this.graphics = null;
    this.timer = null;
    this._activeTweens = [];
  }
  destroy(){
    this.clear();
    if(this.timer){ this.timer.remove(false); this.timer=null; }
  }
  clear(){
    if(this.graphics){ this.graphics.destroy(); this.graphics=null; }
    this._activeTweens.forEach(t=>t.stop());
    this._activeTweens = [];
  }
  setStep(stepIndex){
    this.clear();
    if(!this.enabled) return;
    this.graphics = this.scene.add.graphics().setDepth(8);
    const COL = 0x0B3A6F, LW = 3;
    this.timer = this.scene.time.addEvent({ delay: 60, loop: true, callback: ()=>{
      this.phase = (this.phase + 2) % 40;
      this._redraw(stepIndex, COL, LW);
    }});
    this._redraw(stepIndex, COL, LW);
  }
  _redraw(stepIndex, COL, LW){
    const G = this.graphics; if(!G) return;
    G.clear();
    const P = this.scene.state.players.map(p=>({x:p.g.x, y:p.g.y}));
    if(stepIndex===0){
      this._dashedArrow(P[0], P[1], {color:COL, width:LW});
      this._ghostBall(P[0], P[1]);
    } else if(stepIndex===1){
      const p4 = P[3]; const tgt4 = { x: this.scene.scale.width*0.30, y: this.scene.scale.height*0.70 };
      this._curvedArrow(p4, tgt4, 0.2, {color:COL, width:LW});
      const p3 = P[2]; const tgt3 = { x: this.scene.scale.width*0.80, y: this.scene.scale.height*0.28 };
      this._curvedArrow(p3, tgt3, -0.25, {color:COL, width:LW});
    } else if(stepIndex===2){
      const p5 = P[4];
      const hoopY = (this.scene.CONFIG?.court?.proportions ? (this.scene.scale.height*(this.scene.CONFIG.court.proportions.hoop_y_ratio||0.06)) : 60);
      this._curvedArrow(p5, {x:this.scene.scale.width/2, y:hoopY+52}, 0.15, {color:COL, width:LW});
    }
  }
  _ghostBall(a,b){
    const dot = this.scene.add.circle(a.x, a.y, 6, 0xFF8C00).setDepth(9);
    const tw = this.scene.tweens.add({ targets: dot, x: b.x, y: b.y, duration: 700, repeat: -1, ease: 'Linear' });
    this._activeTweens.push(tw);
  }
  _dashedArrow(a,b, {color=0xffffff, width=2}={}){
    const G=this.graphics;
    G.lineStyle(width, color, 1);
    const dx=b.x-a.x, dy=b.y-a.y;
    const len=Math.hypot(dx,dy);
    const ux=dx/len, uy=dy/len;
    const dash=14, gap=10;
    let dist = (this.phase % (dash+gap)) - (dash+gap);
    while(dist < len){
      const s = Math.max(0, dist);
      const e = Math.min(len, dist + dash);
      if(e>0){
        G.beginPath();
        G.moveTo(a.x + ux*s, a.y + uy*s);
        G.lineTo(a.x + ux*e, a.y + uy*e);
        G.strokePath();
      }
      dist += dash + gap;
    }
    this._arrowHead(b, Math.atan2(dy,dx), color, width);
  }
  _curvedArrow(a,b, curvature=0.2, {color=0xffffff, width=2}={}){
    const G=this.graphics;
    G.lineStyle(width, color, 1);
    const mid = { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
    const nx = b.y - a.y, ny = -(b.x - a.x);
    const nlen = Math.hypot(nx,ny)||1;
    const k = curvature * Math.hypot(b.x-a.x, b.y-a.y);
    const cx = mid.x + (nx/nlen)*k;
    const cy = mid.y + (ny/nlen)*k;
    const segs = 28;
    const pts = [];
    for(let i=0;i<=segs;i++){
      const t=i/segs;
      const x = (1-t)*(1-t)*a.x + 2*(1-t)*t*cx + t*t*b.x;
      const y = (1-t)*(1-t)*a.y + 2*(1-t)*t*cy + t*t*b.y;
      pts.push({x,y});
    }
    const dash=16, gap=10; let acc=-(this.phase % (dash+gap));
    for(let i=1;i<pts.length;i++){
      const p0=pts[i-1], p1=pts[i];
      const segLen=Math.hypot(p1.x-p0.x, p1.y-p0.y);
      let s=0;
      while(s<segLen){
        const rem=segLen-s;
        const dlen = Math.min(dash, rem);
        if(acc<dash){
          const t0=s/segLen, t1=(s+dlen)/segLen;
          const x0=p0.x+(p1.x-p0.x)*t0, y0=p0.y+(p1.y-p0.y)*t0;
          const x1=p0.x+(p1.x-p0.x)*t1, y1=p0.y+(p1.y-p0.y)*t1;
          G.beginPath(); G.moveTo(x0,y0); G.lineTo(x1,y1); G.strokePath();
        }
        s += dlen + gap
        acc = (acc + dlen + gap) % (dash+gap);
      }
    }
    const last=pts[pts.length-1], prev=pts[pts.length-2];
    const ang=Math.atan2(last.y-prev.y, last.x-prev.x);
    this._arrowHead(b, ang, color, width);
  }
  _arrowHead(p, ang, color, width){
    const G=this.graphics; const L=10;
    const a1=ang+Math.PI*0.85, a2=ang-Math.PI*0.85;
    const p1={x:p.x - Math.cos(a1)*L, y:p.y - Math.sin(a1)*L};
    const p2={x:p.x - Math.cos(a2)*L, y:p.y - Math.sin(a2)*L};
    G.lineStyle(width, color, 1);
    G.beginPath(); G.moveTo(p.x,p.y); G.lineTo(p1.x,p1.y); G.strokePath();
    G.beginPath(); G.moveTo(p.x,p.y); G.lineTo(p2.x,p2.y); G.strokePath();
  }
}
