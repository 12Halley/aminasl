// Sudoku — gerador com solução única garantida, notas, dicas, desfazer e jogo guardado no dispositivo.
import { $, h, rec, seg, veu, fmt, shuffle, estrelas, som, vibrar } from "./util.js";

const NIVEIS = { facil: ["Fácil", 40], medio: ["Médio", 33], dificil: ["Difícil", 27] };
const bits = (m) => { const r = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) r.push(d); return r; };

/* ---------- Solver / gerador (máscaras de bits + célula mais restrita) ---------- */
function resolver(g, limite, aleatorio) {
  const L = Array(9).fill(0), C = Array(9).fill(0), B = Array(9).fill(0), b = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
  for (let i = 0; i < 81; i++) if (g[i]) { const m = 1 << g[i]; L[Math.floor(i / 9)] |= m; C[i % 9] |= m; B[b(i)] |= m; }
  let n = 0, sol = null;
  (function passo() {
    let mi = -1, mm = 0, mc = 10;
    for (let i = 0; i < 81; i++) if (!g[i]) {
      const m = ~(L[Math.floor(i / 9)] | C[i % 9] | B[b(i)]) & 0x3fe, c = bits(m).length;
      if (c < mc) { mc = c; mi = i; mm = m; if (c === 0) return; }
    }
    if (mi < 0) { n++; if (!sol) sol = g.slice(); return; }
    let ds = bits(mm); if (aleatorio) ds = shuffle(ds);
    for (const d of ds) {
      const m = 1 << d, r = Math.floor(mi / 9), c = mi % 9, bb = b(mi);
      g[mi] = d; L[r] |= m; C[c] |= m; B[bb] |= m;
      passo();
      g[mi] = 0; L[r] &= ~m; C[c] &= ~m; B[bb] &= ~m;
      if (n >= limite) return;
    }
  })();
  return { n, sol };
}
function gerar(alvo) {
  const sol = resolver(Array(81).fill(0), 1, true).sol, p = sol.slice();
  for (const i of shuffle([...Array(81).keys()])) {
    if (p.filter(Boolean).length <= alvo) break;
    const v = p[i]; p[i] = 0;
    if (resolver(p.slice(), 2, false).n !== 1) p[i] = v;
  }
  return { sol, p };
}

/* ---------- Interface ---------- */
const app = $("#app");
app.innerHTML = `
  <div class="g-row"><div id="nivel"></div></div>
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="tempo">0:00</b><span>Tempo</span></div>
    <div class="stat"><b id="erros">0</b><span>Erros</span></div>
    <div class="stat"><b id="rec">–</b><span>Recorde</span></div></div>
    <button class="btn ghost small" id="novo" type="button">Novo jogo</button></div>
  <div class="quadro sd-q" id="q"><div class="sudo" id="sd" role="grid" aria-label="Grelha de Sudoku"></div></div>
  <div class="g-row c">
    <button class="btn ghost small" id="notas" type="button" aria-pressed="false">Notas</button>
    <button class="btn ghost small" id="apagar" type="button">Apagar</button>
    <button class="btn ghost small" id="desf" type="button">Desfazer</button>
    <button class="btn ghost small" id="dica" type="button">Dica</button></div>
  <div class="numpad" id="np"></div>`;

let nivel = rec.get("sd.nivel", "medio"), sol = [], dado = [], v = [], nt = [], sel = -1, seg0 = 0, timer = 0, erros = 0, dicas = 0, modoNotas = false, hist = [], fim = false;
const q = $("#q"), sd = $("#sd"), painel = veu(q);
const cels = [];
for (let i = 0; i < 81; i++) {
  const b = h("button", "sc" + ((i % 9) % 3 === 2 && i % 9 < 8 ? " c3" : "") + ((Math.floor(i / 9) % 3 === 2 && i < 72) ? " r3" : "")); b.type = "button"; b.dataset.i = i;
  b.addEventListener("click", () => { sel = i; pintar(); }); sd.appendChild(b); cels.push(b);
}
const np = $("#np");
for (let d = 1; d <= 9; d++) { const b = h("button", "", `${d}<small></small>`); b.type = "button"; b.dataset.d = d; b.addEventListener("click", () => digitar(d)); np.appendChild(b); }

const segNivel = seg($("#nivel"), Object.entries(NIVEIS).map(([k, x]) => [k, x[0]]), nivel, (x) => { nivel = x; rec.set("sd.nivel", x); novo(); }, "Dificuldade");
$("#novo").addEventListener("click", novo);
$("#notas").addEventListener("click", () => { modoNotas = !modoNotas; $("#notas").setAttribute("aria-pressed", String(modoNotas)); });
$("#apagar").addEventListener("click", apagar); $("#desf").addEventListener("click", desfazer); $("#dica").addEventListener("click", dica);

function novo(restaurar) {
  clearInterval(timer); timer = 0; fim = false; painel.esconder(); hist = []; sel = -1; modoNotas = false; $("#notas").setAttribute("aria-pressed", "false");
  if (restaurar) { ({ nivel, sol, dado, v, nt, seg0, erros, dicas } = restaurar); }
  else {
    const g = gerar(NIVEIS[nivel][1]); sol = g.sol; v = g.p.slice(); dado = g.p.map(Boolean); nt = Array(81).fill(0); seg0 = 0; erros = 0; dicas = 0;
  }
  segNivel.set(nivel);
  const m = rec.get("sd.rec." + nivel, 0); $("#rec").textContent = m ? fmt(m) : "–";
  timer = setInterval(() => { if (!document.hidden && !fim) { seg0++; $("#tempo").textContent = fmt(seg0); if (seg0 % 5 === 0) guardar(); } }, 1000);
  $("#tempo").textContent = fmt(seg0); pintar(); guardar();
}
function guardar() { if (!fim) rec.set("sd.estado", { nivel, sol, dado, v, nt, seg0, erros, dicas }); }

function pintar() {
  const sr = sel >= 0 ? Math.floor(sel / 9) : -1, sc = sel >= 0 ? sel % 9 : -1, sv = sel >= 0 ? v[sel] : 0, caixa = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
  const cont = Array(10).fill(0);
  for (let i = 0; i < 81; i++) {
    const e = cels[i], r = Math.floor(i / 9), c = i % 9; if (v[i]) cont[v[i]]++;
    e.classList.toggle("dado", dado[i]); e.classList.toggle("sel", i === sel);
    e.classList.toggle("rel", sel >= 0 && i !== sel && (r === sr || c === sc || caixa(i) === caixa(sel)));
    e.classList.toggle("mesmo", sv > 0 && v[i] === sv && i !== sel);
    e.classList.toggle("bad", !!v[i] && !dado[i] && v[i] !== sol[i]);
    if (v[i]) e.textContent = v[i];
    else if (nt[i]) e.innerHTML = '<span class="nts">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<i>${nt[i] & (1 << d) ? d : ""}</i>`).join("") + "</span>";
    else e.textContent = "";
    e.setAttribute("aria-label", `Linha ${r + 1}, coluna ${c + 1}, ${v[i] ? "valor " + v[i] : "vazia"}`);
  }
  np.querySelectorAll("button").forEach((b) => { const d = +b.dataset.d; b.disabled = cont[d] >= 9; b.querySelector("small").textContent = 9 - cont[d] > 0 ? 9 - cont[d] : ""; });
  $("#erros").textContent = erros;
}
const instantaneo = () => ({ v: v.slice(), nt: nt.slice(), erros });
function empilhar() { hist.push(instantaneo()); if (hist.length > 60) hist.shift(); }
function desfazer() { const a = hist.pop(); if (!a || fim) return; v = a.v; nt = a.nt; erros = a.erros; pintar(); guardar(); }

function digitar(d) {
  if (fim || sel < 0 || dado[sel]) return;
  empilhar();
  if (modoNotas) { if (v[sel]) { hist.pop(); return; } nt[sel] ^= 1 << d; }
  else {
    if (v[sel] === d) { v[sel] = 0; }
    else {
      v[sel] = d; nt[sel] = 0;
      const r = Math.floor(sel / 9), c = sel % 9, b = Math.floor(sel / 27) * 3 + Math.floor(c / 3);
      for (let i = 0; i < 81; i++) if (Math.floor(i / 9) === r || i % 9 === c || (Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3)) === b) nt[i] &= ~(1 << d);
      if (d !== sol[sel]) { erros++; vibrar(40); som.tom(170, 0.12, "sawtooth", 0.05); } else som.tom(520, 0.08, "triangle", 0.05);
    }
  }
  pintar(); guardar(); verificar();
}
function apagar() { if (fim || sel < 0 || dado[sel] || (!v[sel] && !nt[sel])) return; empilhar(); v[sel] = 0; nt[sel] = 0; pintar(); guardar(); }
function dica() {
  if (fim) return; let i = sel >= 0 && !dado[sel] && v[sel] !== sol[sel] ? sel : -1;
  if (i < 0) { const f = [...Array(81).keys()].filter((k) => v[k] !== sol[k]); if (!f.length) return; i = f[Math.floor(Math.random() * f.length)]; }
  empilhar(); sel = i; v[i] = sol[i]; nt[i] = 0; dado[i] = true; dicas++; pintar(); guardar(); verificar();
}
function verificar() {
  if (!v.every((x, i) => x === sol[i])) return;
  fim = true; clearInterval(timer); rec.del("sd.estado"); som.vitoria(); vibrar(60);
  const t = seg0 + dicas * 30, ant = rec.get("sd.rec." + nivel, 0), novoRec = !ant || t < ant; if (novoRec) rec.set("sd.rec." + nivel, t);
  const e = erros === 0 && dicas === 0 ? 3 : erros <= 3 && dicas <= 2 ? 2 : 1; $("#rec").textContent = fmt(Math.min(ant || t, t));
  painel.mostrar(`<h2>Resolvido</h2>${estrelas(e)}<p>${fmt(seg0)}, ${erros} erro${erros === 1 ? "" : "s"}, ${dicas} dica${dicas === 1 ? "" : "s"}.${novoRec ? " Novo recorde." : ""}</p><button class="btn" id="outra" type="button">Novo jogo</button>`);
  $("#outra", q).addEventListener("click", () => novo());
}
addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) { if (e.key.toLowerCase() === "z") { e.preventDefault(); desfazer(); } return; }
  if (e.key >= "1" && e.key <= "9") { digitar(+e.key); return; }
  const k = e.key;
  if (k === "Backspace" || k === "Delete" || k === "0") { apagar(); return; }
  if (k.toLowerCase() === "n") { $("#notas").click(); return; }
  const mv = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[k]; if (mv == null) return; e.preventDefault();
  if (sel < 0) sel = 40; else { const r = Math.floor(sel / 9) + (mv === -9 ? -1 : mv === 9 ? 1 : 0), c = (sel % 9) + (mv === -1 ? -1 : mv === 1 ? 1 : 0); if (r >= 0 && r < 9 && c >= 0 && c < 9) sel = r * 9 + c; }
  pintar();
});
const salvo = rec.get("sd.estado", null);
novo(salvo && salvo.sol && salvo.sol.length === 81 ? salvo : undefined);
