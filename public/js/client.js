'use strict';

/**
 * Cliente del MVP "Platense Playbook Runner" — Versión Media Cancha (UI Rediseñada)
 * - Mantiene la conexión Socket.IO y el manejo de input sin cambios
 * - Rediseña completamente el render de la cancha y jugadores
 * - Vista: MEDIA CANCHA OFENSIVA (aro arriba, zona pintada bajando)
 * - Reserva 80x80 px en la esquina superior izquierda para futuro reloj de posesión
 */

// ====== Playbook (MVP hardcodeado, sin cambios funcionales) ======
const playbook = {
  ofensiva_uno: {
    name: 'Ofensiva 1 (uno)',
    initialPositions: {
      '1': { x: 400, y: 550 },
      '2': { x: 700, y: 450 },
      '3': { x: 100, y: 450 },
      '4': { x: 100, y: 150 },
      '5': { x: 700, y: 150 },
    },
    paths: {
      '1': [{ x: 400, y: 550 }],
      '2': [
        { x: 700, y: 450 },
        { x: 600, y: 300 },
        { x: 500, y: 200 }
      ],
      '3': [
        { x: 100, y: 450 },
        { x: 200, y: 550 }
      ],
      '4': [
        { x: 100, y: 150 },
        { x: 650, y: 400 }
      ],
      '5': [
        { x: 700, y: 150 },
        { x: 500, y: 50 }
      ]
    },
    actions: [
      { type: 'pass', from: 1, to: 2, time: 0.5 },
      { type: 'screen', by: 4, for: 2, time: 1.0 },
      { type: 'pass', from: 2, to: 5, time: 2.0 }
    ]
  }
};

// ====== Canvas & Escala (mantenemos 800x600 virtuales) ======
const VIRTUAL_W = 800;
const VIRTUAL_H = 600;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

let SCALE = 1;
function resizeCanvas() {
  const scale = Math.min(window.innerWidth / VIRTUAL_W, window.innerHeight / VIRTUAL_H);
  SCALE = scale;
  canvas.width = Math.floor(VIRTUAL_W * scale);
  canvas.height = Math.floor(VIRTUAL_H * scale);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function withVirtualScale() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
}

// ====== Socket.IO (sin cambios) ======
/* global io */
const socket = io();

let myNumber = null;
let isSpectator = true;
let gameState = { players: {} };

socket.on('playerInfo', (info) => {
  isSpectator = !!info.spectator;
  myNumber = info.number;
});

socket.on('gameState', (state) => {
  gameState = state;
});

// ====== Input (sin cambios) ======
const KEY_TO_DIR = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right'
};

const movement = { up: false, down: false, left: false, right: false };

function emitMovementIfChanged(prev, next) {
  if (
    prev.up !== next.up ||
    prev.down !== next.down ||
    prev.left !== next.left ||
    prev.right !== next.right
  ) {
    socket.emit('playerMovement', next);
  }
}

function handleKey(e, pressed) {
  const dir = KEY_TO_DIR[e.key];
  if (!dir) return;
  e.preventDefault();
  const prev = { ...movement };
  movement[dir] = pressed;
  emitMovementIfChanged(prev, movement);
}

window.addEventListener('keydown', (e) => handleKey(e, true), { passive: false });
window.addEventListener('keyup',   (e) => handleKey(e, false), { passive: false });

// ====== Layout y Transformaciones de Media Cancha ======
const HALF_X_MIN = 0;
const HALF_X_MAX = 800;
const HALF_Y_MIN = 0;
const HALF_Y_MAX = 300;
const HALF_W = HALF_X_MAX - HALF_X_MIN;
const HALF_H = HALF_Y_MAX - HALF_Y_MIN;
const HALF_ASPECT = HALF_W / HALF_H;

function computeLayout() {
  const reservedPx = 80;
  const reservedVX = reservedPx / SCALE;

  const margin = 16;
  const courtX = reservedVX + margin;
  const courtY = margin;

  const availW = VIRTUAL_W - courtX - margin;
  const availH = VIRTUAL_H - courtY - margin;

  let courtW = Math.min(availW, availH * HALF_ASPECT);
  let courtH = courtW / HALF_ASPECT;

  const extraH = availH - courtH;
  const finalCourtY = courtY + Math.max(0, extraH / 2);

  const unit = courtW / HALF_W;

  return {
    x: courtX,
    y: finalCourtY,
    w: courtW,
    h: courtH,
    unit: unit,
    reservedPx: reservedPx,
    reservedVX: reservedVX
  };
}

function projectServerYToHalfCourt(y) {
  const SCALE_Y = HALF_H / VIRTUAL_H;
  return HALF_Y_MIN + (y - HALF_Y_MIN) * SCALE_Y;
}

function worldToCanvas(x, y, layout) {
  const cx = (x - HALF_X_MIN) / HALF_W;
  const projectedY = projectServerYToHalfCourt(y);
  const clampedY = Math.max(HALF_Y_MIN, Math.min(HALF_Y_MAX, projectedY));
  const cy = (clampedY - HALF_Y_MIN) / HALF_H;

  return {
    x: layout.x + cx * layout.w,
    y: layout.y + cy * layout.h
  };
}

// ====== Render ======
function clear() {
  ctx.save();
  withVirtualScale();
  ctx.fillStyle = '#DEB887'; // parquet
  ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
  ctx.restore();
}

function drawCourt(layout) {
  ctx.save();
  withVirtualScale();
  ctx.translate(layout.x, layout.y);
  ctx.scale(layout.w / HALF_W, layout.h / HALF_H);

  const LINE_COLOR = '#FFFFFF';
  const LINE_W = 3;
  const PAINT_COLOR = '#1E90FF';

  ctx.lineWidth = LINE_W;
  ctx.strokeStyle = LINE_COLOR;
  ctx.fillStyle = PAINT_COLOR;

  const width = HALF_W;
  const height = HALF_H;

  const hoopX = width / 2;
  const hoopY = 18;
  const rimR = 9;

  const backboardR = 24;
  const backboardY = hoopY - 10;

  const keyW = 160;
  const keyH = 190;
  const keyX = (width - keyW) / 2;
  const keyY = 0;

  const freeThrowY = keyH;
  const freeThrowR = 60;

  const threeR = 238;
  const threeStart = Math.PI * 1.15;
  const threeEnd   = Math.PI * -0.15;

  // Baseline superior
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();

  // Laterales
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height);
  ctx.stroke();

  // Línea de medio campo (abajo)
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.stroke();

  // Zona pintada
  ctx.beginPath();
  ctx.rect(keyX, keyY, keyW, keyH);
  ctx.fill();
  ctx.stroke();

  // Línea de tiro libre
  ctx.beginPath();
  ctx.moveTo(keyX, freeThrowY);
  ctx.lineTo(keyX + keyW, freeThrowY);
  ctx.stroke();

  // Semicírculo de tiro libre
  ctx.beginPath();
  ctx.arc(hoopX, freeThrowY, freeThrowR, Math.PI, 0, false);
  ctx.stroke();

  // Triple
  ctx.beginPath();
  ctx.arc(hoopX, hoopY, threeR, threeStart, threeEnd, false);
  ctx.stroke();

  // Tablero (semicírculo)
  ctx.beginPath();
  ctx.arc(hoopX, backboardY, backboardR, Math.PI, 0, false);
  ctx.stroke();

  // Aro
  ctx.beginPath();
  ctx.arc(hoopX, hoopY, rimR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawPlayers(layout) {
  const unit = layout.unit;
  const outerR = 12 * unit;
  const innerR = outerR * 0.65;

  const players = (gameState && gameState.players) ? gameState.players : {};
  for (const p of Object.values(players)) {
    const pos = worldToCanvas(p.x, p.y, layout);
    const x = pos.x;
    const y = pos.y;
    const isMe = !isSpectator && p.number === myNumber;

    ctx.save();
    withVirtualScale();

    // Exterior
    ctx.beginPath();
    ctx.arc(x, y, outerR, 0, Math.PI * 2);
    ctx.fillStyle = '#00008B';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Interior
    ctx.beginPath();
    ctx.arc(x, y, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Número
    ctx.fillStyle = '#00008B';
    const fontPx = Math.max(14, Math.floor(20 * unit));
    ctx.font = 'bold ' + fontPx + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.number ?? '?'), x, y);

    if (isMe) {
      ctx.beginPath();
      ctx.arc(x, y, outerR + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}

function drawPlayGuides(layout) {
  const unit = layout.unit;
  ctx.save();
  withVirtualScale();

  ctx.lineWidth = Math.max(2, 3 * unit);
  ctx.setLineDash([10 * unit, 10 * unit]);
  ctx.globalAlpha = 0.9;

  const play = playbook.ofensiva_uno;
  for (const pid of Object.keys(play.paths)) {
    const path = play.paths[pid];
    if (!path || path.length === 0) continue;

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';

    ctx.beginPath();
    const start = worldToCanvas(path[0].x, path[0].y, layout);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < path.length; i++) {
      const pt = worldToCanvas(path[i].x, path[i].y, layout);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    ctx.setLineDash([]);
    for (const ptWorld of path) {
      const pt = worldToCanvas(ptWorld.x, ptWorld.y, layout);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4 * unit, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
    ctx.setLineDash([10 * unit, 10 * unit]);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const pad = 10;
  const text = isSpectator ? 'Modo: ESPECTADOR' : ('Jugador: ' + myNumber);
  ctx.font = '600 14px system-ui, -apple-system, Segoe UI, Roboto';
  const metrics = ctx.measureText(text);
  const boxW = metrics.width + 16;
  const boxH = 26;

  const x = canvas.width - boxW - pad;
  const y = pad;

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(x, y, boxW, boxH);

  ctx.fillStyle = '#0b1726';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 8, y + boxH / 2);

  ctx.restore();
}

// ====== Bucle principal ======
function gameLoop() {
  clear();
  const layout = computeLayout();
  drawCourt(layout);
  drawPlayGuides(layout);
  drawPlayers(layout);
  drawHUD();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
