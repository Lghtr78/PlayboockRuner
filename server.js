'use strict';

/**
 * Servidor del MVP "Platense Playbook Runner"
 * - Express sirve /public
 * - Socket.IO coordina el estado compartido de 5 jugadores
 * - El servidor emite gameState ~30 FPS y aplica el movimiento según input del cliente
 */

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ====== Config ======
const PORT = process.env.PORT || 3000;

// Dimensiones virtuales de la cancha (coinciden con el cliente)
const VIRTUAL_W = 800;
const VIRTUAL_H = 600;

// Posiciones iniciales (coinciden con la jugada "Ofensiva 1 (uno)" del cliente)
const INITIAL_POSITIONS = {
  1: { x: 400, y: 550 },
  2: { x: 700, y: 450 },
  3: { x: 100, y: 450 },
  4: { x: 100, y: 150 },
  5: { x: 700, y: 150 },
};

// ====== Estado del juego en el servidor ======
/**
 * players: { [socketId]: { x:number, y:number, number:1..5 } }
 * inputs:  { [socketId]: { up:boolean, down:boolean, left:boolean, right:boolean } }
 * spectators: Set<string> (socketIds que exceden los 5 jugadores)
 * availableNumbers: números libres para asignar (1..5)
 */
const players = {};
const inputs = {};
const spectators = new Set();
const availableNumbers = new Set([1, 2, 3, 4, 5]);

// ====== Utilitarios ======
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const pickLowestAvailableNumber = () =>
  availableNumbers.size ? Math.min(...Array.from(availableNumbers)) : null;

// ====== Static /public ======
app.use(express.static(path.join(__dirname, 'public')));

// ====== Socket.IO ======
io.on('connection', (socket) => {
  // Asignación de jugador o espectador
  const assignedNumber = pickLowestAvailableNumber();

  if (assignedNumber) {
    availableNumbers.delete(assignedNumber);
    const spawn = INITIAL_POSITIONS[assignedNumber] || { x: VIRTUAL_W / 2, y: VIRTUAL_H / 2 };
    players[socket.id] = { x: spawn.x, y: spawn.y, number: assignedNumber };
    inputs[socket.id] = { up: false, down: false, left: false, right: false };
    socket.emit('playerInfo', { spectator: false, number: assignedNumber });
  } else {
    spectators.add(socket.id);
    socket.emit('playerInfo', { spectator: true, number: null });
  }

  // El cliente envía el estado de teclas cada vez que cambia
  socket.on('playerMovement', (payload) => {
    // Ignorar si es espectador o payload inválido
    if (!players[socket.id]) return;
    const up = !!payload?.up;
    const down = !!payload?.down;
    const left = !!payload?.left;
    const right = !!payload?.right;
    inputs[socket.id] = { up, down, left, right };
  });

  socket.on('disconnect', () => {
    if (players[socket.id]) {
      const num = players[socket.id].number;
      availableNumbers.add(num);
      delete players[socket.id];
      delete inputs[socket.id];
    } else {
      spectators.delete(socket.id);
    }
  });
});

// ====== Bucle del servidor (30 FPS) ======
const TICK_MS = 1000 / 30;
const SPEED_UNITS_PER_SEC = 240; // velocidad base (unidades virtuales por segundo)
let lastTick = Date.now();

setInterval(() => {
  const now = Date.now();
  const dt = (now - lastTick) / 1000; // segundos desde el último tick
  lastTick = now;

  // Actualizar posiciones según input guardado
  for (const id of Object.keys(players)) {
    const move = inputs[id] || { up: false, down: false, left: false, right: false };
    let vx = 0;
    let vy = 0;
    if (move.left) vx -= 1;
    if (move.right) vx += 1;
    if (move.up) vy -= 1;
    if (move.down) vy += 1;

    // Normalizar diagonal
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx /= len;
      vy /= len;
    }

    const p = players[id];
    p.x = clamp(p.x + vx * SPEED_UNITS_PER_SEC * dt, 12, VIRTUAL_W - 12);
    p.y = clamp(p.y + vy * SPEED_UNITS_PER_SEC * dt, 12, VIRTUAL_H - 12);
  }

  // Emitir estado reducido (solo 5 jugadores)
  const trimmed = {};
  for (const [id, data] of Object.entries(players)) {
    trimmed[id] = { x: Math.round(data.x), y: Math.round(data.y), number: data.number };
  }

  io.emit('gameState', { players: trimmed, t: now });
}, TICK_MS);

// ====== Start ======
server.listen(PORT, () => {
  console.log(`Platense Playbook Runner listo en http://localhost:${PORT}`);
});
