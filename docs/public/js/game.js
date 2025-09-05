fetch('data/plays.json')
  .then(response => response.json())
  .then(data => {
    console.log("Jugadas cargadas correctamente:", data);

    window.__PLAYS_DATA__ = data.plays || [];

    const $select = document.getElementById('play-select');
    const $toggle = document.getElementById('mode-toggle');
    const $reset  = document.getElementById('reset-btn');

    // -------- NUEVO: función para posicionar jugadores --------
    function positionPlayers(play) {
      if (!play || !play.initialPositions) return;

      const court = document.querySelector('canvas'); // tu canvas principal
      const ctxWidth = court.width;
      const ctxHeight = court.height;

      Object.entries(play.initialPositions).forEach(([playerNum, pos]) => {
        // Coordenadas normalizadas a píxeles
        const x = pos.x * ctxWidth;
        const y = pos.y * ctxHeight;

        console.log(`Jugador ${playerNum} a posición:`, x, y);

        // TODO: aquí se debe mover el sprite real del jugador
        // Ejemplo genérico si existe una función movePlayer():
        if (window.movePlayer) {
          window.movePlayer(playerNum, x, y);
        }
      });
    }
    // -----------------------------------------------------------

    // Poblar selector como antes
    if ($select) {
      $select.innerHTML = '';
      window.__PLAYS_DATA__.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name || p.id}`;
        if (idx === 0) opt.selected = true;
        $select.appendChild(opt);
      });
    }

    // Estado
    let currentPlay = window.__PLAYS_DATA__[0] || null;

    // Eventos
    if ($select) {
      $select.addEventListener('change', () => {
        const id = $select.value;
        currentPlay = window.__PLAYS_DATA__.find(p => p.id === id) || null;
        console.log('[Selector] Jugada elegida:', id, currentPlay);
        positionPlayers(currentPlay); // <-- Aquí usamos la función nueva
      });
    }

    if ($reset) {
      $reset.addEventListener('click', () => {
        console.log('[Reset] Reiniciando a posiciones iniciales');
        positionPlayers(currentPlay); // Reinicia a posiciones iniciales
      });
    }
  })
  .catch(error => {
    console.error("Error al cargar plays.json:", error);
  });

