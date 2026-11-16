// 2048 — peças com deslize e fusão animados, desfazer, continuar depois do 2048, estado guardado.
import { $, h, rec, veu, deslizar, ri, som } from "./util.js";

const N = 4;
const app = $("#app");
app.innerHTML = `
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="pts">0</b><span>Pontos</span></div>
    <div class="stat"><b id="rec">0</b><span>Recorde</span></div></div>
    <div class="g-row"><button class="btn ghost small" id="desf" type="button">Desfazer</button><button class="btn ghost small" id="novo" type="button">Novo jogo</button></div></div>
  <div class="quadro t48-q" id="q"><div class="t48" id="t"><div class="t48-bg"></div></div></div>
  <p class="g-nota">Setas, WASD ou desliza o dedo.</p>`;

const q = $("#q"), T = $("#t"), painel = veu(q);
let tiles = [], pts = 0, id = 0, hist = [], venceu = false, ocupado = false;
const bg = T.firstElementChild; bg.innerHTML = Array(N * N).fill("<i></i>").join("");

const grelha = () => { const g = Array.from({ length: N }, () => Array(N).fill(null)); tiles.forEach((t) => (g[t.r][t.c] = t)); return g; };
function vazias() { const g = grelha(), v = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c]) v.push([r, c]); return v; }
function criar(r, c, v, novo) {
  const t = { id: ++id, r, c, v, el: h("div", "tl"), novo }; t.el.innerHTML = "<span></span>"; T.appendChild(t.el); tiles.push(t); pintar(t); return t;
}
function pintar(t, pop) {
  t.el.firstChild.textContent = t.v; t.el.dataset.v = t.v > 2048 ? "big" : t.v; t.el.style.setProperty("--r", t.r); t.el.style.setProperty("--c", t.c);
  if (t.novo) { t.el.classList.add("novo"); t.novo = false; }
  if (pop) { t.el.classList.remove("pop"); void t.el.offsetWidth; t.el.classList.add("pop"); }
}
function pontos() { $("#pts").textContent = pts; $("#rec").textContent = Math.max(rec.get("2048"), pts); }
function guardar() { rec.set("2048.estado", { tiles: tiles.map((t) => [t.r, t.c, t.v]), pts, venceu }); }
function sortear() { const v = vazias(); if (!v.length) return; const [r, c] = v[ri(0, v.length - 1)]; criar(r, c, Math.random() < 0.9 ? 2 : 4, true); }

function novo(restaurar) {
  tiles.forEach((t) => t.el.remove()); tiles = []; pts = 0; hist = []; venceu = false; painel.esconder();
  if (restaurar) { restaurar.tiles.forEach(([r, c, v]) => criar(r, c, v, false)); pts = restaurar.pts; venceu = restaurar.venceu; }
  else { sortear(); sortear(); }
  pontos(); guardar();
}
function snapshot() { return { tiles: tiles.map((t) => [t.r, t.c, t.v]), pts, venceu }; }

function mover(dir) { // dir: [dr, dc]
  if (ocupado || painel.ativo) return;
  const antes = snapshot(), [dr, dc] = dir; let mexeu = false, ganho = 0;
  const g = grelha(), ordR = [...Array(N).keys()], ordC = [...Array(N).keys()];
  if (dr > 0) ordR.reverse(); if (dc > 0) ordC.reverse();
  const fundidas = new Set(), remover = [];
  for (const r of ordR) for (const c of ordC) {
    const t = g[r][c]; if (!t) continue;
    let nr = r, nc = c;
    while (true) {
      const pr = nr + dr, pc = nc + dc;
      if (pr < 0 || pr >= N || pc < 0 || pc >= N) break;
      const alvo = g[pr][pc];
      if (!alvo) { nr = pr; nc = pc; continue; }
      if (alvo.v === t.v && !fundidas.has(alvo) && !remover.includes(alvo)) { nr = pr; nc = pc; t.funde = alvo; }
      break;
    }
    if (nr !== r || nc !== c) mexeu = true;
    g[r][c] = null;
    if (t.funde) { const a = t.funde; t.funde = null; fundidas.add(a); a.v *= 2; ganho += a.v; a.pop = true; remover.push(t); t.r = nr; t.c = nc; }
    else { g[nr][nc] = t; t.r = nr; t.c = nc; }
  }
  if (!mexeu) return;
  hist.push(antes); if (hist.length > 5) hist.shift();
  ocupado = true; pts += ganho;
  tiles.forEach((t) => { pintar(t); });
  setTimeout(() => {
    remover.forEach((t) => { t.el.remove(); tiles = tiles.filter((x) => x !== t); });
    tiles.forEach((t) => { if (t.pop) { t.pop = false; pintar(t, true); } });
    sortear(); pontos(); guardar(); ocupado = false;
    if (ganho) som.tom(300 + Math.log2(Math.max(2, ganho)) * 60, 0.1, "triangle", 0.06);
    fim();
  }, 120);
}
function fim() {
  const maior = Math.max(...tiles.map((t) => t.v));
  if (maior >= 2048 && !venceu) {
    venceu = true; guardar(); rec.set("2048", Math.max(rec.get("2048"), pts)); som.vitoria();
    painel.mostrar('<h2>2048</h2><p>Chegaste lá. Queres continuar?</p><div class="g-row c"><button class="btn" id="cont" type="button">Continuar</button><button class="btn ghost" id="nv" type="button">Novo jogo</button></div>');
    $("#cont", q).addEventListener("click", () => painel.esconder()); $("#nv", q).addEventListener("click", () => { rec.del("2048.estado"); novo(); }); return;
  }
  if (vazias().length) return;
  const g = grelha();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const v = g[r][c].v; if ((c < N - 1 && g[r][c + 1].v === v) || (r < N - 1 && g[r + 1][c].v === v)) return; }
  rec.set("2048", Math.max(rec.get("2048"), pts)); pontos(); rec.del("2048.estado");
  painel.mostrar(`<h2>Sem movimentos</h2><div class="big">${pts}</div><p>Maior peça: ${maior}.</p><div class="g-row c"><button class="btn" id="nv" type="button">Novo jogo</button><button class="btn ghost" id="df" type="button">Desfazer</button></div>`);
  $("#nv", q).addEventListener("click", () => novo()); $("#df", q).addEventListener("click", desfazer);
}
function desfazer() {
  const a = hist.pop(); if (!a) return; const h2 = hist.slice(); painel.esconder();
  tiles.forEach((t) => t.el.remove()); tiles = []; a.tiles.forEach(([r, c, v]) => criar(r, c, v, false)); pts = a.pts; venceu = a.venceu; hist = h2; pontos(); guardar();
}
$("#desf").addEventListener("click", desfazer); $("#novo").addEventListener("click", () => { rec.del("2048.estado"); novo(); });
const M = { arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0], arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1] };
addEventListener("keydown", (e) => { const d = M[e.key.toLowerCase()]; if (d) { e.preventDefault(); mover(d); } });
deslizar(T, (d) => mover({ up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[d]), 24);
novo(rec.get("2048.estado", null) || undefined);
