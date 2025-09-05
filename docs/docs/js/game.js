import { loadConfig, applyDifficultyToUI } from './lib/configLoader.js';
import { ensureTutorial } from './lib/tutorial.js';
import { PlaysUI } from './lib/playsUI.js';
import { MainScene } from './scenes/MainScene.js';
import './lib/adminPanel.js';

(async function boot(){
  const CONFIG = await loadConfig();
  applyDifficultyToUI(CONFIG);
  const phaserConfig = {
    type: Phaser.CANVAS,
    parent: document.body,
    backgroundColor: CONFIG.display.canvas_background || '#2A2E35',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH,
             width: CONFIG.display.resolution.width, height: CONFIG.display.resolution.height },
    fps: { target: CONFIG.display.fps_target || 60, forceSetTimeOut: true },
    scene: [ new MainScene(CONFIG) ]
  };
  const game = new Phaser.Game(phaserConfig);
  // UI auxiliares
  ensureTutorial(CONFIG);
  new PlaysUI(CONFIG, (i)=>{ if(window.__setPlayIndex) window.__setPlayIndex(i); });
})();