export const AdminState = {
  overrides: JSON.parse(localStorage.getItem('admin_overrides') || '{}')
};
export async function loadConfig() {
  const status = document.getElementById('status');
  try {
    const [game, nodes, plays] = await Promise.all([
      fetch('../config/game.config.json').then(r=>r.json()),
      fetch('../config/nodes.json').then(r=>r.json()),
      fetch('../config/plays.json').then(r=>r.json())
    ]);
    const cfg = merge(game, AdminState.overrides);
    status.textContent = 'Config cargada';
    return { ...cfg, nodes, plays };
  } catch (e) {
    status.textContent = 'Error cargando config';
    console.error(e);
    throw e;
  }
}
function merge(base, overrides){ const out = structuredClone(base); if(overrides) deepMerge(out, overrides); return out; }
function deepMerge(target, src){ for(const k in src){ if(src[k] && typeof src[k]==='object' && !Array.isArray(src[k])){ target[k]=target[k]||{}; deepMerge(target[k], src[k]); } else { target[k]=src[k]; } } }
export function applyDifficultyToUI(config){
  const sel = document.getElementById('difficulty'); if(!sel) return;
  sel.value = config.difficulty?.default || 'principiante';
  sel.addEventListener('change', ()=>{
    const o = AdminState.overrides || {}; o.difficulty = o.difficulty || {}; o.difficulty.default = sel.value;
    localStorage.setItem('admin_overrides', JSON.stringify(o)); location.reload();
  });
}
