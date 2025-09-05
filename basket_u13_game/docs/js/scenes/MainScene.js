import { DecisionNodeEngine } from '../lib/nodes.js';
import { log } from '../lib/telemetry.js';
import { ArrowsEngine } from '../lib/arrows.js';

export class MainScene extends Phaser.Scene {
  preload(){
    const C = this.CONFIG;
    // No cargamos court_bg porque usamos cancha procedimental
    if (C?.overlays?.reference?.enabled){
      const tex = C.overlays.reference.texture_path || 'assets/img/overlay_ref.png';
      this.load.image('overlay_ref', tex);
    }
  }

  constructor(CONFIG){
    super('MainScene');
    this.CONFIG = CONFIG;
    this.state = { players: [], ball: null, selectedPlayer: null };
    this.flags = { dragging: false };
    this._dragStart = { x: 0, y: 0, t: 0 };
  }

  create(){
    // Telemetría
    window.__TELEMETRY_ENABLED__ = !!this.CONFIG.assists?.telemetry_enabled;

    const { width, height } = this.scale;
    this.drawCourt();

    // Jugadores (estética ficha blanca + borde azul)
    const rad = this.CONFIG.players.radius_px || 28;
    this._playerRadius = rad;
    const numberStyle = { fontFamily:'Arial', fontSize: (this.CONFIG.players.number_font_size||18), color:'#0B3A6F' };

    const pos = [
      {x:width*0.35,y:height*0.75},
      {x:width*0.50,y:height*0.70},
      {x:width*0.65,y:height*0.75},
      {x:width*0.42,y:height*0.55},
      {x:width*0.58,y:height*0.55}
    ];

    this.state.players = pos.map((p,i)=>{
      const g = this.add.circle(p.x,p.y,rad,0xffffff).setStrokeStyle(4,0x0B3A6F).setInteractive({useHandCursor:true});
      const t = this.add.text(p.x-6,p.y-8,String(i+1), numberStyle);
      g.depth=2; t.depth=3; g.playerIndex=i+1; g.pair={g,t};
      g.on('pointerdown',(pointer)=>{ this.state.selectedPlayer=g.pair; this.flags.dragging=false; this._dragStart={x:pointer.x,y:pointer.y,t:this.time.now}; });
      return g.pair;
    });

    // Defensores grises de referencia
    const defPos=[
      {x:width*0.35,y:height*0.60},
      {x:width*0.50,y:height*0.55},
      {x:width*0.65,y:height*0.60},
      {x:width*0.42,y:height*0.40},
      {x:width*0.58,y:height*0.40}
    ];
    this._defenders = [];
    defPos.forEach(p=>{ const d=this.add.circle(p.x,p.y,rad,0x111111).setAlpha(0.6); this._defenders.push(d); });

    // Pelota
    const ballR = this.CONFIG.ball.radius_px || 12;
    const ballCol = Phaser.Display.Color.HexStringToColor(this.CONFIG.ball.color || '#FF8C00').color;
    this.state.ball = this.add.circle(pos[0].x, pos[0].y - rad - 10, ballR, ballCol);
    this.state.ball.depth = 4;

    // Drag suave
    const TH = 8;
    this.input.on('pointermove',(pointer)=>{
      if(this.state.selectedPlayer && pointer.isDown){
        const dx=pointer.x-this._dragStart.x, dy=pointer.y-this._dragStart.y;
        if(!this.flags.dragging && Math.hypot(dx,dy)>=TH) this.flags.dragging=true;
        if(this.flags.dragging){
          const {g,t}=this.state.selectedPlayer; g.x=pointer.x; g.y=pointer.y; t.x=g.x-6; t.y=g.y-8;
        }
      }
    });
    this.input.on('pointerup',()=>{ this.state.selectedPlayer=null; this.flags.dragging=false; log('drag_end'); });

    // Tap para pase
    this.input.on('gameobjectdown',(pointer,target)=>{ target.__downX=pointer.x; target.__downY=pointer.y; target.__downT=this.time.now; });
    this.input.on('gameobjectup',(pointer,target)=>{
      if(!target.playerIndex) return;
      const dx=pointer.x-(target.__downX??pointer.x), dy=pointer.y-(target.__downY??pointer.y), dt=this.time.now-(target.__downT??this.time.now);
      const tap = Math.hypot(dx,dy) < 8 && dt < 250;
      if(!tap) return;
      const off=(this._playerRadius||28)+10;
      if(this._ballTween&&this._ballTween.isPlaying()) this._ballTween.stop();
      this._ballTween=this.tweens.add({targets:this.state.ball,x:target.x,y:target.y-off,duration:250});
    });

    // Overlay de referencia opcional
    if (this.CONFIG?.overlays?.reference?.enabled && this.textures.exists('overlay_ref')){
      const ov=this.add.image(0,0,'overlay_ref').setOrigin(0).setDepth(9).setAlpha(this.CONFIG.overlays.reference.alpha??0.6);
      ov.setScale(this.scale.width/ov.width, this.scale.height/ov.height);
      this._overlayRef=ov;
    }
    // Arrows engine y callback expuesta
    this._arrows = new ArrowsEngine(this, this.CONFIG);
    window.__setPlayIndex = (i)=>{ this._arrows.setStep(i); };
  }

  update(time){
    this._nodes = this._nodes || new DecisionNodeEngine(this,this.CONFIG);
    this._nodes.update(time);
  }

  _nearestDefenderTo(x,y){
    let best=null, bd=1e9;
    (this._defenders||[]).forEach(d=>{ const dd=Phaser.Math.Distance.Between(d.x,d.y,x,y); if(dd<bd){bd=dd;best=d;} });
    return best;
  }

  drawCourt(){
    const C=this.CONFIG;
    const {width,height}=this.scale;
    const style=C.court?.style||{};
    const P=C.court?.proportions||{};

    const m = Math.max(12, Math.floor(width * (P.margin_ratio ?? 0.04)));
    const w = width - 2*m, h = height - 2*m;

    // Piso (madera)
    const floorColor=Phaser.Display.Color.HexStringToColor(style.floor_color||'#E9D2AD').color;
    const stripeColor=Phaser.Display.Color.HexStringToColor(style.floor_stripe_color||'#DBBE93').color;
    const stripeW=style.floor_stripe_width||24;
    const stripeA=style.floor_stripe_alpha??0.18;
    const gFloor=this.add.graphics(); gFloor.fillStyle(floorColor,1); gFloor.fillRect(m,m,w,h);
    const gStripes=this.add.graphics(); gStripes.fillStyle(stripeColor,stripeA);
    for(let x=m; x<m+w; x+=stripeW){ gStripes.fillRect(x, m, Math.max(2,Math.floor(stripeW*0.45)), h); }

    // Pintura (zona)
    const paintColor=Phaser.Display.Color.HexStringToColor(style.paint_color||'#1484d6').color;
    const pW = w * (P.paint_width_ratio ?? 0.30);
    const pH = h * (P.paint_height_ratio ?? 0.48);
    const pX = m + (w - pW)/2;
    const pY = m + h * (P.paint_top_ratio ?? 0.02);
    const gPaint=this.add.graphics(); gPaint.fillStyle(paintColor,1); gPaint.fillRect(pX,pY,pW,pH);

    if (C.court?.draw_lines===false) return;

    // Líneas
    const linesColor=Phaser.Display.Color.HexStringToColor(C.court?.lines_color||style.lines_color||'#FFFFFF').color;
    const lw = (P.line_thickness ?? 2.0);
    const g=this.add.graphics(); g.lineStyle(lw, linesColor, 1);
    // Marco
    g.strokeRect(m,m,w,h);

    const cx = m + w/2;
    const hoopY = m + h*(P.hoop_y_ratio ?? 0.06);
    // Aro
    g.lineStyle(3, 0xffffff, 1); g.strokeCircle(cx, hoopY, 9);

    // Círculo de libres dentro del paint
    const ftR = h * (P.ft_radius_ratio ?? 0.085);
    g.lineStyle(lw, linesColor, 1);
    g.strokeCircle(cx, pY + pH*0.58, ftR);

    // Círculo restringido pequeño
    const rR = h * (P.restricted_radius_ratio ?? 0.06);
    g.strokeCircle(cx, hoopY + rR*0.1, rR);

    // Arco de 3 pts (semicírculo superior)
    const r3 = h * (P.r3_radius_ratio ?? 0.78);
    g.beginPath();
    g.arc(cx, hoopY, r3, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20), true);
    g.strokePath();
  }
}
