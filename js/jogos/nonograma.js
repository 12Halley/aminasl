// Nonograma — a vitória é validada pelas pistas (qualquer solução válida conta), não por uma única imagem.
import { $, h, rec, seg, veu, fmt, clamp, som, vibrar } from "./util.js";

const P = (nome, ...linhas) => ({ nome, grelha: linhas.map((l) => [...l].map((x) => (x === "#" ? 1 : 0))) });
const GRUPOS = {
  5: [P("Coração", ".#.#.", "#####", "#####", ".###.", "..#.."), P("Estrela", "..#..", ".###.", "#####", ".###.", ".#.#."), P("Flor", ".#.#.", "#####", ".###.", "#####", ".#.#.")],
  7: [P("Casa", "...#...", "..###..", ".#####.", "#######", ".#####.", ".##.##.", ".##.##."), P("Lua", "..####", ".###..", "###...", "###...", "###...", ".###..", "..####")],
  10: [
    P("Gato", "##......##", "###....###", "##########", "##########", "##.####.##", "##########", "####..####", ".########.", "..######..", "...####..."),
    P("Lanterna", "..######..", ".########.", "##########", "###.##.###", "###.##.###", "##########", ".########.", "..######..", "...####...", "....##...."),
    P("Torre", "....##....", "...####...", "..######..", ".########.", "..######..", "..##..##..", "..##..##..", "..######..", "..######..", ".########."),
  ],
};
const dicas = (linhas) => linhas.map((l) => { const r = []; let n = 0; for (const v of l) { if (v === 1) n++; else if (n) { r.push(n); n = 0; } } if (n) r.push(n); return r.length ? r : [0]; });
const colunas = (g) => g[0].map((_, c) => g.map((l) => l[c]));
const igual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const cheio = (l) => l.map((v) => (v === 1 ? 1 : 0));

const app = $("#app");
app.innerHTML = `
  <div class="g-row"><div id="tam"></div></div>
  <div class="g-row"><div id="pz"></div></div>
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="tempo">0:00</b><span>Tempo</span></div>
    <div class="stat"><b id="prog">0%</b><span>Progresso</span></div>
    <div class="stat"><b id="rec">–</b><span>Recorde</span></div></div></div>
  <div class="quadro ng-q" id="q"><div id="ng"></div></div>
  <div class="g-row c"><div id="modo"></div></div>
  <div class="g-row c">
    <button class="btn ghost small" id="desf" type="button">Desfazer</button>
    <button class="btn ghost small" id="verif" type="button">Verificar</button>
    <button class="btn ghost small" id="limp" type="button">Limpar</button>
  </div>
  <p class="g-msg" id="msg" aria-live="polite">&nbsp;</p>`;

let tam = rec.get("nono.tam", "5"), idx = 0, pz, user, rd, cd, ml = "enc", hist = [], seg0 = 0, timer = 0, terminado = false;
const q = $("#q"), ng = $("#ng"), msg = $("#msg");

function celulaTam(C, maxR) { return clamp(Math.floor((Math.min(q.clientWidth || 360, 520) - 24) / (C + maxR * 0.6)), 20, 44); }

seg($("#tam"), [["5", "Pequeno 5×5"], ["7", "Médio 7×7"], ["10", "Grande 10×10"]], tam, (v) => { tam = v; rec.set("nono.tam", v); idx = 0; escolhas(); novo(); }, "Tamanho");
function escolhas() {
  const box = $("#pz"); box.innerHTML = ""; box.className = "";
  seg(box, GRUPOS[tam].map((p, i) => [i, p.nome]), idx, (v) => { idx = +v; novo(); }, "Puzzle");
}
seg($("#modo"), [["enc", "Preencher"], ["x", "Marcar vazio"]], ml, (v) => { ml = v; }, "Modo de toque");

function novo() {
  pz = GRUPOS[tam][idx]; const g = pz.grelha, R = g.length, C = g[0].length;
  rd = dicas(g); cd = dicas(colunas(g)); user = g.map((l) => l.map(() => 0)); hist = []; terminado = false;
  clearInterval(timer); timer = 0; seg0 = 0; $("#tempo").textContent = "0:00"; $("#prog").textContent = "0%";
  const melhor = rec.get("nono." + pz.nome, 0); $("#rec").textContent = melhor ? fmt(melhor) : "–"; msg.innerHTML = "&nbsp;";
  const maxR = Math.max(...rd.map((d) => d.length));
  ng.className = "ng"; ng.style.cssText = `--cel:${celulaTam(C, maxR)}px;--C:${C};--R:${R}`;
  let html = '<div></div><div class="ng-cc">' + cd.map((d, c) => `<div class="cc" data-c="${c}">${d.map((n) => `<span>${n}</span>`).join("")}</div>`).join("") + "</div>";
  html += '<div class="ng-rc">' + rd.map((d, r) => `<div class="rc" data-r="${r}">${d.map((n) => `<span>${n}</span>`).join("")}</div>`).join("") + "</div>";
  html += '<div class="ng-g">';
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++)
    html += `<i class="nc${(c + 1) % 5 === 0 && c < C - 1 ? " dr" : ""}${(r + 1) % 5 === 0 && r < R - 1 ? " db" : ""}" data-r="${r}" data-c="${c}"></i>`;
  ng.innerHTML = html + "</div>";
  verificarLinhas();
}

const cel = (r, c) => ng.querySelector(`.nc[data-r="${r}"][data-c="${c}"]`);
function pintar(r, c, v) { user[r][c] = v; const e = cel(r, c); e.classList.toggle("f", v === 1); e.classList.toggle("x", v === 2); e.classList.remove("err"); }

function verificarLinhas() {
  let tudo = true, feitas = 0, total = 0;
  user.forEach((l, r) => { const ok = igual(dicas([cheio(l)])[0], rd[r]); ng.querySelector(`.rc[data-r="${r}"]`).classList.toggle("ok", ok); tudo = tudo && ok; });
  colunas(user).forEach((l, c) => { const ok = igual(dicas([cheio(l)])[0], cd[c]); ng.querySelector(`.cc[data-c="${c}"]`).classList.toggle("ok", ok); tudo = tudo && ok; });
  pz.grelha.forEach((l, r) => l.forEach((v, c) => { if (v) { total++; if (user[r][c] === 1) feitas++; } }));
  $("#prog").textContent = Math.round((feitas / total) * 100) + "%";
  return tudo;
}

let arrastar = null;
const celulaEm = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.classList && el.classList.contains("nc") ? el : null; };
ng.addEventListener("pointerdown", (e) => {
  const el = e.target.closest ? e.target.closest(".nc") : null; if (!el || terminado) return;
  e.preventDefault(); try { ng.setPointerCapture(e.pointerId); } catch {}
  if (!timer) timer = setInterval(() => { seg0++; $("#tempo").textContent = fmt(seg0); }, 1000);
  const r = +el.dataset.r, c = +el.dataset.c, alvo = ml === "enc" ? 1 : 2;
  arrastar = { v: user[r][c] === alvo ? 0 : alvo, r0: r, c0: c, eixo: null, muda: [] };
  aplicar(r, c);
});
ng.addEventListener("pointermove", (e) => {
  if (!arrastar) return; const el = celulaEm(e); if (!el) return;
  const r = +el.dataset.r, c = +el.dataset.c, a = arrastar;
  if (!a.eixo) { if (r === a.r0 && c !== a.c0) a.eixo = "h"; else if (c === a.c0 && r !== a.r0) a.eixo = "v"; else return; }
  if ((a.eixo === "h" && r !== a.r0) || (a.eixo === "v" && c !== a.c0)) return;
  aplicar(r, c);
});
function aplicar(r, c) {
  const a = arrastar, atual = user[r][c];
  if (atual === a.v) return;
  a.muda.push([r, c, atual]); pintar(r, c, a.v);
}
function soltar() {
  if (!arrastar) return;
  const m = arrastar.muda; arrastar = null;
  if (m.length) { hist.push(m); som.tom(380, 0.05, "triangle", 0.04); }
  if (verificarLinhas() && !terminado) ganhar();
}
ng.addEventListener("pointerup", soltar); ng.addEventListener("pointercancel", soltar);

$("#desf").addEventListener("click", () => {
  if (terminado) return; const m = hist.pop(); if (!m) return;
  m.reverse().forEach(([r, c, v]) => pintar(r, c, v)); verificarLinhas();
});
$("#limp").addEventListener("click", novo);
$("#verif").addEventListener("click", () => {
  if (terminado) return; let n = 0;
  pz.grelha.forEach((l, r) => l.forEach((v, c) => { if (user[r][c] === 1 && !v) { cel(r, c).classList.add("err"); n++; } }));
  msg.textContent = n ? (n === 1 ? "Há 1 casa que não pertence à imagem." : `Há ${n} casas que não pertencem à imagem.`) : "Tudo certo até agora.";
  setTimeout(() => ng.querySelectorAll(".err").forEach((e) => e.classList.remove("err")), 1600);
});

function ganhar() {
  terminado = true; clearInterval(timer); timer = 0; vibrar(60); som.vitoria();
  ng.classList.add("ganho");
  const ant = rec.get("nono." + pz.nome, 0), novoRec = !ant || seg0 < ant;
  if (novoRec) { rec.set("nono." + pz.nome, seg0); $("#rec").textContent = fmt(seg0); }
  msg.textContent = `${pz.nome} revelado em ${fmt(seg0)}.${novoRec ? " Novo recorde." : ""}`;
  const prox = (idx + 1) % GRUPOS[tam].length;
  const b = h("button", "btn small"); b.type = "button"; b.textContent = "Próximo puzzle"; b.style.marginTop = ".8rem";
  b.addEventListener("click", () => { idx = prox; escolhas(); novo(); });
  msg.appendChild(document.createElement("br")); msg.appendChild(b);
}

addEventListener("resize", () => {
  const C = pz.grelha[0].length, maxR = Math.max(...rd.map((d) => d.length));
  ng.style.setProperty("--cel", celulaTam(C, maxR) + "px");
});
escolhas(); novo();
