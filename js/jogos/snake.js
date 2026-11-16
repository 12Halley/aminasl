// Snake — fila de comandos (sem viragens perdidas), modo com paredes ou atravessar, luz dourada bónus, pausa automática.
import { $, h, rec, seg, veu, ciclo, canvasDPR, deslizar, ri, som, vibrar } from "./util.js";

const G = 20, L = 400, TAU = Math.PI * 2;
const app = $("#app");
app.innerHTML = `
  <div class="g-row"><div id="modo"></div></div>
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="pts">0</b><span>Pontos</span></div>
    <div class="stat"><b id="rec">0</b><span>Recorde</span></div></div>
    <button class="btn ghost small" id="pausa" type="button">Pausa</button></div>
  <div class="quadro" id="q"><canvas id="cv" style="width:100%"></canvas></div>
  <div class="pad" aria-label="Direções">
    <button class="u" type="button" aria-label="Cima"><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button>
    <button class="l" type="button" aria-label="Esquerda"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
    <button class="d" type="button" aria-label="Baixo"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
    <button class="r" type="button" aria-label="Direita"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
  </div>`;

let modo = rec.get("snake.modo", "paredes"), s, c, painelPausa = false;
const q = $("#q"), cv = $("#cv"), painel = veu(q);
seg($("#modo"), [["paredes", "Com paredes"], ["atravessar", "Atravessar"]], modo, (v) => { modo = v; rec.set("snake.modo", v); preparar(); }, "Modo");
const chave = () => "snake." + modo;

function medir() { const w = Math.min(q.clientWidth || 360, 520); cv.style.height = w + "px"; c = canvasDPR(cv, w, w); c.scale(w / L, w / L); }
addEventListener("resize", () => { medir(); if (s) desenhar(1); });

function preparar() {
  s = { corpo: [[10, 10], [9, 10], [8, 10]], dir: [1, 0], fila: [], comida: null, bonus: null, pts: 0, acc: 0, t: 0, fim: false, cresce: 0 };
  colocar(); $("#pts").textContent = 0; $("#rec").textContent = rec.get(chave());
  lacos.parar(); desenhar(1);
  painelPausa = false;
  painel.mostrar(`<h2>Snake</h2><p>Setas, WASD ou desliza o dedo.</p><button class="btn" id="ini" type="button">Começar</button>`);
  $("#ini", q).addEventListener("click", () => { painel.esconder(); lacos.ligar(); });
}
function livre() { let x, y; do { x = ri(0, G - 1); y = ri(0, G - 1); } while (s.corpo.some(([a, b]) => a === x && b === y) || (s.comida && s.comida[0] === x && s.comida[1] === y)); return [x, y]; }
function colocar() { s.comida = livre(); }
const intervalo = () => Math.max(0.065, 0.14 - s.pts * 0.0006);

function dirigir(d) {
  const ult = s.fila.length ? s.fila[s.fila.length - 1] : s.dir;
  if ((d[0] === -ult[0] && d[1] === -ult[1]) || (d[0] === ult[0] && d[1] === ult[1])) return;
  if (s.fila.length < 2) s.fila.push(d);
}
function passo() {
  if (s.fila.length) s.dir = s.fila.shift();
  const [hx, hy] = s.corpo[0]; let nx = hx + s.dir[0], ny = hy + s.dir[1];
  if (modo === "atravessar") { nx = (nx + G) % G; ny = (ny + G) % G; }
  else if (nx < 0 || ny < 0 || nx >= G || ny >= G) return terminar();
  const cola = s.cresce > 0 ? 0 : 1;
  if (s.corpo.slice(0, s.corpo.length - cola).some(([a, b]) => a === nx && b === ny)) return terminar();
  s.corpo.unshift([nx, ny]);
  if (s.cresce > 0) s.cresce--; else s.corpo.pop();
  if (nx === s.comida[0] && ny === s.comida[1]) {
    s.pts += 10; s.cresce += 0; s.corpo.push([...s.corpo[s.corpo.length - 1]]); som.tom(520 + (s.pts % 100) * 4, 0.1, "triangle", 0.07); colocar(); $("#pts").textContent = s.pts;
    if (!s.bonus && (s.pts / 10) % 6 === 0) s.bonus = { p: livre(), t: 6 };
  } else if (s.bonus && nx === s.bonus.p[0] && ny === s.bonus.p[1]) {
    s.pts += 50; s.bonus = null; vibrar(30); som.tom(880, 0.2, "sine", 0.09); $("#pts").textContent = s.pts;
  }
}
function terminar() {
  s.fim = true; lacos.parar(); vibrar(100); som.tom(140, 0.4, "sawtooth", 0.07);
  const ant = rec.get(chave()), novoRec = s.pts > ant; if (novoRec) rec.set(chave(), s.pts); $("#rec").textContent = Math.max(ant, s.pts);
  painel.mostrar(`<h2>${novoRec && s.pts ? "Novo recorde" : "Fim de jogo"}</h2><div class="big">${s.pts}</div><p>Comprimento ${s.corpo.length}.</p><button class="btn" id="de-novo" type="button">Jogar outra vez</button>`);
  $("#de-novo", q).addEventListener("click", () => { preparar(); painel.esconder(); lacos.ligar(); });
}
const lacos = ciclo((dt) => {
  s.t += dt; s.acc += dt;
  if (s.bonus) { s.bonus.t -= dt; if (s.bonus.t <= 0) s.bonus = null; }
  while (s.acc >= intervalo() && !s.fim) { s.acc -= intervalo(); passo(); }
  desenhar(s.acc / intervalo());
});

function desenhar(f) {
  const u = L / G; c.clearRect(0, 0, L, L);
  c.strokeStyle = "rgba(238,222,190,.05)"; c.lineWidth = 1; c.beginPath();
  for (let i = 1; i < G; i++) { c.moveTo(i * u, 0); c.lineTo(i * u, L); c.moveTo(0, i * u); c.lineTo(L, i * u); } c.stroke();
  const luz = (x, y, r, cor, fx) => { const g = c.createRadialGradient(x, y, 0, x, y, r * 2.8); g.addColorStop(0, cor); g.addColorStop(1, "rgba(255,190,100,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.8, 0, TAU); c.fill(); c.fillStyle = fx; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const pulso = 1 + Math.sin(s.t * 5) * 0.08;
  luz((s.comida[0] + 0.5) * u, (s.comida[1] + 0.5) * u, u * 0.28 * pulso, "rgba(255,190,100,.5)", "#ffe3a8");
  if (s.bonus) luz((s.bonus.p[0] + 0.5) * u, (s.bonus.p[1] + 0.5) * u, u * 0.36 * pulso, "rgba(242,187,98,.7)", "#fff4d2");
  const n = s.corpo.length;
  for (let i = n - 1; i >= 0; i--) {
    const [x, y] = s.corpo[i], a = 1 - (i / n) * 0.65, r = u * (i === 0 ? 0.46 : 0.4);
    c.fillStyle = i === 0 ? "#f8d99c" : `rgba(182,162,221,${a})`;
    c.beginPath(); c.roundRect ? c.roundRect(x * u + u / 2 - r, y * u + u / 2 - r, r * 2, r * 2, r * 0.6) : c.rect(x * u + u / 2 - r, y * u + u / 2 - r, r * 2, r * 2); c.fill();
  }
  const [hx, hy] = s.corpo[0], px = -s.dir[1], py = s.dir[0];
  c.fillStyle = "#0b0e22";
  for (const k of [-1, 1]) { c.beginPath(); c.arc((hx + 0.5) * u + s.dir[0] * u * 0.14 + px * k * u * 0.17, (hy + 0.5) * u + s.dir[1] * u * 0.14 + py * k * u * 0.17, u * 0.07, 0, TAU); c.fill(); }
  void f;
}

function pausar(v) {
  if (!s || s.fim || (!lacos.ativo && !painelPausa)) return;
  if (v) { painelPausa = true; lacos.parar(); painel.mostrar('<h2>Pausa</h2><button class="btn" id="cont" type="button">Continuar</button>'); $("#cont", q).addEventListener("click", () => pausar(false)); }
  else { painelPausa = false; painel.esconder(); lacos.ligar(); }
}
$("#pausa").addEventListener("click", () => pausar(!painelPausa));
document.addEventListener("visibilitychange", () => { if (document.hidden) pausar(true); });
const DIRS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === " " || k === "p") { e.preventDefault(); pausar(!painelPausa); return; }
  if (DIRS[k] && s && lacos.ativo) { e.preventDefault(); dirigir(DIRS[k]); }
});
deslizar(cv, (d) => { if (lacos.ativo) dirigir({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d]); }, 20);
document.querySelectorAll(".pad button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (lacos.ativo) dirigir({ u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[b.className]); }));
medir(); preparar();
