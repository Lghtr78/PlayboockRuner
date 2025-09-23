export const AdminState = {
  overrides: JSON.parse(localStorage.getItem('admin_overrides') || '{}')
};
export async function loadConfig() {
  const status = document.getElementById('status');
  try {
    // Base robusta: relativa a /docs/public/index.html
const base = new URL('../config/', window.location.href);

const getJSON = async (name) => {
  const res = await fetch(new URL(name, base));
  if (!res.ok) throw new Error(`${name} ${res.status} ${res.url}`);
  return res.json();
};

const [game, nodes, plays] = await Promise.all([
  getJSON('game.config.json'),
  getJSON('nodes.json'),
  getJSON('plays.json')
]);

const cfg = merge(game, AdminState.overrides);
if (status) status.textContent = 'Config cargada';
return { ...cfg, nodes, plays };

  } catch (e) {
  if (status) status.textContent = 'Error cargando config';
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
