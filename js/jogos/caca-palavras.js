// Caça-palavras — gerador com dificuldade, seleção por arrasto com "snap" a 8 direções, dicas e recordes.
import { $, h, rec, seg, veu, shuffle, fmt, norm, clamp, ri, estrelas, som, vibrar } from "./util.js";

const TEMAS = {
  gatinhos: ["Gatinhos", ["GATO", "MIAU", "PATA", "PELO", "CAUDA", "BIGODE", "FELINO", "RONRONAR", "PETISCO", "NOVELO"]],
  anime: ["Anime", ["NARUTO", "SAKURA", "SASUKE", "BLEACH", "MANGA", "KAWAII", "SENPAI", "CHIBI", "TANJIRO", "OTAKU"]],
  amor: ["Amor", ["AMOR", "BEIJO", "ABRAÇO", "CORAÇÃO", "FLOR", "ROSA", "CARINHO", "SAUDADE", "RAPUNZEL", "LANTERNA"]],
  musica: ["Música", ["MÚSICA", "RITMO", "MELODIA", "LETRA", "BANDA", "CANÇÃO", "PIANO", "VIOLÃO", "LAUFEY", "REFRÃO"]],
};
const NIVEIS = {
  facil: ["Fácil", 10, 6, [[0, 1], [1, 0]]],
  normal: ["Normal", 12, 8, [[0, 1], [1, 0], [1, 1], [-1, 1]]],
  dificil: ["Difícil", 12, 10, [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]],
};
const DIR8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]; // [dc, dr]

const app = $("#app");
app.innerHTML = `
  <div class="g-row"><div id="tema"></div></div>
  <div class="g-row"><div id="nivel"></div></div>
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="tempo">0:00</b><span>Tempo</span></div>
    <div class="stat"><b id="enc">0/0</b><span>Palavras</span></div>
    <div class="stat"><b id="rec">–</b><span>Recorde</span></div></div>
    <div class="g-row"><button class="btn ghost small" id="dica" type="button">Dica</button><button class="btn ghost small" id="novo" type="button">Nova grelha</button></div></div>
  <div class="quadro cp-q" id="q"><div class="cp" id="grade"></div></div>
  <ul class="cp-lista" id="lista"></ul>`;

let tema = rec.get("cp.tema", "gatinhos"), nivel = rec.get("cp.nivel", "normal");
let N = 12, letras = [], colocadas = [], achadas = new Set(), seg0 = 0, timer = 0, dicas = 0, fim = false;
const q = $("#q"), grade = $("#grade"), painel = veu(q);

seg($("#tema"), Object.entries(TEMAS).map(([k, v]) => [k, v[0]]), tema, (v) => { tema = v; rec.set("cp.tema", v); novo(); }, "Tema");
seg($("#nivel"), Object.entries(NIVEIS).map(([k, v]) => [k, v[0]]), nivel, (v) => { nivel = v; rec.set("cp.nivel", v); novo(); }, "Dificuldade");
$("#novo").addEventListener("click", novo);
$("#dica").addEventListener("click", dica);

function construir(palavras, n, dirs) {
  for (let tent = 0; tent < 60; tent++) {
    const g = Array.from({ length: n }, () => Array(n).fill("")), out = [];
    let ok = true;
    for (const w of [...palavras].sort((a, b) => norm(b).length - norm(a).length)) {
      const p = norm(w), opc = [];
      for (const [dr, dc] of dirs) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const er = r + dr * (p.length - 1), ec = c + dc * (p.length - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        let cruz = 0, livre = true;
        for (let i = 0; i < p.length; i++) { const x = g[r + dr * i][c + dc * i]; if (x && x !== p[i]) { livre = false; break; } if (x) cruz++; }
        if (livre) opc.push([r, c, dr, dc, cruz + Math.random() * 1.4]);
      }
      if (!opc.length) { ok = false; break; }
      opc.sort((a, b) => b[4] - a[4]);
      const [r, c, dr, dc] = opc[ri(0, Math.min(5, opc.length - 1))];
      for (let i = 0; i < p.length; i++) g[r + dr * i][c + dc * i] = p[i];
      out.push({ show: w, p, r, c, dr, dc });
    }
    if (ok) {
      const pool = (palavras.map(norm).join("") + "AEIOSRNDMTLCUP").split("");
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) g[r][c] = pool[ri(0, pool.length - 1)];
      return { g, out };
    }
  }
  return null;
}

function novo() {
  clearInterval(timer); timer = 0; seg0 = 0; dicas = 0; fim = false; achadas = new Set(); painel.esconder();
  const [, tam, qtd, dirs] = NIVEIS[nivel]; N = tam;
  const palavras = shuffle(TEMAS[tema][1]).slice(0, qtd);
  let res = construir(palavras, N, dirs);
  if (!res) res = construir(palavras.slice(0, 5), N, dirs);
  letras = res.g; colocadas = res.out;
  grade.style.setProperty("--n", N); grade.innerHTML = "";
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const e = h("i", "lt"); e.textContent = letras[r][c]; e.dataset.r = r; e.dataset.c = c; grade.appendChild(e); }
  $("#lista").innerHTML = colocadas.slice().sort((a, b) => a.show.localeCompare(b.show, "pt")).map((w) => `<li data-p="${w.p}">${w.show}</li>`).join("");
  $("#tempo").textContent = "0:00"; atualizar();
  const m = rec.get(chave(), 0); $("#rec").textContent = m ? fmt(m) : "–";
}
const chave = () => `cp.${tema}.${nivel}`;
const atualizar = () => { $("#enc").textContent = achadas.size + "/" + colocadas.length; };
const cel = (r, c) => grade.children[r * N + c];

/* ---- seleção ---- */
let sel = null;
function limparSel() { grade.querySelectorAll(".sel").forEach((e) => e.classList.remove("sel")); }
function ponto(e) { const b = grade.getBoundingClientRect(), cs = b.width / N; return [(e.clientX - b.left) / cs, (e.clientY - b.top) / cs]; }
function caminho(ini, x, y) {
  const dx = x - (ini.c + 0.5), dy = y - (ini.r + 0.5);
  if (Math.hypot(dx, dy) < 0.55) return [[ini.r, ini.c]];
  const k = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8, [dc, dr] = DIR8[k];
  let passos = Math.round((dx * dc + dy * dr) / (dc * dc + dr * dr));
  const maxC = dc > 0 ? N - 1 - ini.c : dc < 0 ? ini.c : 99, maxR = dr > 0 ? N - 1 - ini.r : dr < 0 ? ini.r : 99;
  passos = clamp(passos, 0, Math.min(maxC, maxR, N));
  return Array.from({ length: passos + 1 }, (_, i) => [ini.r + dr * i, ini.c + dc * i]);
}
grade.addEventListener("pointerdown", (e) => {
  if (fim) return; const el = e.target.closest(".lt"); if (!el) return; e.preventDefault();
  try { grade.setPointerCapture(e.pointerId); } catch {}
  if (!timer) timer = setInterval(() => { seg0++; $("#tempo").textContent = fmt(seg0); }, 1000);
  sel = { r: +el.dataset.r, c: +el.dataset.c, cam: [[+el.dataset.r, +el.dataset.c]] }; pintarSel();
});
grade.addEventListener("pointermove", (e) => { if (!sel) return; const [x, y] = ponto(e); sel.cam = caminho(sel, x, y); pintarSel(); });
function pintarSel() { limparSel(); sel.cam.forEach(([r, c]) => cel(r, c).classList.add("sel")); }
function soltar() {
  if (!sel) return; const cam = sel.cam; sel = null; limparSel();
  if (cam.length < 2) return;
  const txt = cam.map(([r, c]) => letras[r][c]).join(""), rev = [...txt].reverse().join("");
  const w = colocadas.find((x) => !achadas.has(x.p) && (x.p === txt || x.p === rev));
  if (!w) { som.tom(200, 0.1, "triangle", 0.05); return; }
  achadas.add(w.p); const cor = (achadas.size - 1) % 6;
  cam.forEach(([r, c]) => { const e = cel(r, c); e.classList.add("ach"); e.dataset.cor = cor; e.classList.remove("dica"); });
  $(`#lista li[data-p="${w.p}"]`).classList.add("ok"); vibrar(30); som.tom(600 + achadas.size * 40, 0.16, "sine", 0.08); atualizar();
  if (achadas.size === colocadas.length) ganhar();
}
grade.addEventListener("pointerup", soltar); grade.addEventListener("pointercancel", () => { sel = null; limparSel(); });

function dica() {
  if (fim) return; const w = shuffle(colocadas.filter((x) => !achadas.has(x.p)))[0]; if (!w) return;
  dicas++; const e = cel(w.r, w.c); e.classList.add("dica"); setTimeout(() => e.classList.remove("dica"), 2200);
}
function ganhar() {
  fim = true; clearInterval(timer); timer = 0; som.vitoria();
  const t = seg0 + dicas * 15, ant = rec.get(chave(), 0), novoRec = !ant || t < ant; if (novoRec) rec.set(chave(), t);
  const e = dicas === 0 ? 3 : dicas <= 2 ? 2 : 1; $("#rec").textContent = fmt(Math.min(ant || t, t));
  painel.mostrar(`<h2>Todas encontradas</h2>${estrelas(e)}<p>${fmt(seg0)}${dicas ? `, mais ${dicas * 15} s por ${dicas} dica${dicas > 1 ? "s" : ""}` : ", sem dicas"}.${novoRec ? " Novo recorde." : ""}</p><button class="btn" id="outra" type="button">Nova grelha</button>`);
  $("#outra", q).addEventListener("click", novo);
}
novo();
