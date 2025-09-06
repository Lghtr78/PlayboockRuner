// -------------------- IMPORTS (dejarlos siempre al inicio) --------------------
import { loadConfig, applyDifficultyToUI } from './lib/configLoader.js';
import { ensureTutorial } from './lib/tutorial.js';
import { PlaysUI } from './lib/playsUI.js';
import { MainScene } from './scenes/MainScene.js';
import './lib/adminPanel.js';

// -------------------- ARRANQUE DEL JUEGO (dejalo igual) ----------------------
(async function boot(){
  const CONFIG = await loadConfig();
  applyDifficultyToUI(CONFIG);

  const phaserConfig = {
    type: Phaser.CANVAS,
    parent: document.body,
    backgroundColor: CONFIG.display.canvas_background || '#2A2E35',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CONFIG.display.resolution.width,
      height: CONFIG.display.resolution.height
    },
    fps: { target: CONFIG.display.fps_target || 60, forceSetTimeOut: true },
    scene: [ new MainScene(CONFIG) ]
  };

  const game = new Phaser.Game(phaserConfig);

  // UI auxiliares ya existentes
  ensureTutorial(CONFIG);
  new PlaysUI(CONFIG, (i)=>{ if (window.__setPlayIndex) window.__setPlayIndex(i); });
})();

// -------------------- BLOQUE NUEVO: plays.json + UI + posicionado ------------
/**
 * Espera hasta que exista el canvas de Phaser.
 * Evita null cuando el DOM aún no tiene el <canvas>.
 */
function waitForCanvas(cb, tries = 0) {
  const canvas = document.querySelector('canvas');
  if (canvas) return cb(canvas);
  if (tries > 120) { // ~2s @ 60fps
    console.warn('No pude encontrar el canvas a tiempo');
    return;
  }
  requestAnimationFrame(() => waitForCanvas(cb, tries + 1));
}

/**
 * Coloca a cada jugador en su posición inicial (coordenadas normalizadas 0..1).
 * Por ahora SOLO hace console.log; en el PASO 5 conectamos con sprites Phaser.
 */
function positionPlayersOnCanvas(play, canvas) {
  if (!play || !play.initialPositions || !canvas) return;
  const W = canvas.width;
  const H = canvas.height;

  Object.entries(play.initialPositions).forEach(([playerNum, pos]) => {
    const x = Math.round((pos.x || 0) * W);
    const y = Math.round((pos.y || 0) * H);
    console.log(`→ Posicionar jugador ${playerNum} en:`, x, y);

    // FUTURO (Paso 5): mover el sprite real si exponemos un método global:
    // window.movePlayer?.(playerNum, x, y);
  });
}

/**
 * Carga el archivo de jugadas y cablea la UI mínima (selector / toggle / reset).
 * La ruta es relativa a public/: data/plays.json
 */
fetch('data/plays.json')
  .then(r => r.json())
  .then(data => {
    console.log('Jugadas cargadas correctamente:', data);

    // Guardar jugadas en memoria global simple
    window.__PLAYS_DATA__ = Array.isArray(data?.plays) ? data.plays : [];

    // Referencias UI (IDs que agregaste en index.html)
    const $select = document.getElementById('play-select');
    const $toggle = document.getElementById('mode-toggle');
    const $reset  = document.getElementById('reset-btn');

    // Poblar selector
    if ($select) {
      $select.innerHTML = '';
      window.__PLAYS_DATA__.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name || p.id || `Play ${idx + 1}`;
        if (idx === 0) opt.selected = true;
        $select.appendChild(opt);
      });
    }

    // Estado mínimo de UI
    let currentPlay = window.__PLAYS_DATA__[0] || null;
    let isGameMode  = false; // OFF = Demo, ON = Juego

    // Posicionar al cargar por primera vez (cuando haya canvas)
    waitForCanvas((canvas) => positionPlayersOnCanvas(currentPlay, canvas));

    // Eventos
    $select?.addEventListener('change', () => {
      const id = $select.value;
      currentPlay = window.__PLAYS_DATA__.find(p => p.id === id) || null;
      console.log('[Selector] Jugada elegida:', id, currentPlay);
      waitForCanvas((canvas) => positionPlayersOnCanvas(currentPlay, canvas));
    });

    $toggle?.addEventListener('change', () => {
      isGameMode = !!$toggle.checked;
      console.log('[Toggle] Modo Juego:', isGameMode ? 'ON' : 'OFF', '(OFF = Demo)');
    });

    $reset?.addEventListener('click', () => {
      console.log('[Reset] Volver a posiciones iniciales de:', currentPlay?.id);
      waitForCanvas((canvas) => positionPlayersOnCanvas(currentPlay, canvas));
    });
  })
  .catch(err => {
    console.error('Error al cargar plays.json:', err);
  });

    console.error("Error al cargar plays.json:", error);
  });

