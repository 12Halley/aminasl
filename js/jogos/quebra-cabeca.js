// Quebra-cabeça deslizante — embaralhamento sempre resolúvel, desliza várias peças de uma vez, fotografia da galeria.
import { $, h, rec, seg, veu, ri, fmt, estrelas, fotos, quadrada, som, vibrar } from "./util.js";

const app = $("#app");
app.innerHTML = `
  <div class="g-row"><div id="tam"></div></div>
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="mov">0</b><span>Movimentos</span></div>
    <div class="stat"><b id="tempo">0:00</b><span>Tempo</span></div>
    <div class="stat"><b id="rec">–</b><span>Recorde</span></div></div></div>
  <div class="quadro" id="q"><div class="qc" id="qc"></div><div class="qc-ref" id="ref" hidden></div></div>
  <div class="g-row c">
    <button class="btn ghost small" id="ver" type="button" aria-pressed="false">Ver imagem</button>
    <button class="btn ghost small" id="num" type="button" aria-pressed="false">Números</button>
    <button class="btn ghost small" id="novo" type="button">Embaralhar</button>
  </div>
  <div class="g-row c thumbs" id="thumbs"></div>`;

let N = +rec.get("qc.n", 4), img = "", lista = [], fonte = 0;
let pos = [], vazio = 0, mov = 0, seg0 = 0, timer = 0, ganhou = false;
const q = $("#q"), qc = $("#qc"), painel = veu(q), refEl = $("#ref");

seg($("#tam"), [["3", "3×3"], ["4", "4×4"], ["5", "5×5"]], String(N), (v) => { N = +v; rec.set("qc.n", N); novo(); }, "Tamanho");
$("#novo").addEventListener("click", novo);
$("#ver").addEventListener("click", (e) => { const on = refEl.hidden; refEl.hidden = !on; e.currentTarget.setAttribute("aria-pressed", String(on)); });
$("#num").addEventListener("click", (e) => { const on = e.currentTarget.getAttribute("aria-pressed") !== "true"; e.currentTarget.setAttribute("aria-pressed", String(on)); qc.classList.toggle("nums", on); });

function arte() { // imagem de reserva quando não há fotografias
  const c = document.createElement("canvas"); c.width = c.height = 600; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, "#0b0e2a"); g.addColorStop(0.7, "#2b2060"); g.addColorStop(1, "#c87a5a"); x.fillStyle = g; x.fillRect(0, 0, 600, 600);
  for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,244,222,${Math.random() * 0.8})`; x.beginPath(); x.arc(Math.random() * 600, Math.random() * 380, Math.random() * 1.8 + 0.4, 0, 7); x.fill(); }
  for (let i = 0; i < 7; i++) { const cx = 80 + Math.random() * 440, cy = 200 + Math.random() * 360, r = 18 + Math.random() * 24, h = x.createRadialGradient(cx, cy, 0, cx, cy, r * 3); h.addColorStop(0, "rgba(255,200,120,.8)"); h.addColorStop(1, "rgba(255,200,120,0)"); x.fillStyle = h; x.beginPath(); x.arc(cx, cy, r * 3, 0, 7); x.fill(); x.fillStyle = "#ffd79a"; x.beginPath(); x.ellipse(cx, cy, r * 0.5, r * 0.7, 0, 0, 7); x.fill(); }
  return c.toDataURL("image/jpeg", 0.9);
}
async function carregarImagem() {
  if (lista[fonte]) { try { return await quadrada(lista[fonte].src); } catch {} }
  return arte();
}

function embaralhar() {
  pos = Array.from({ length: N * N }, (_, i) => i); vazio = N * N - 1;
  let anterior = -1, passos = N * N * 14;
  for (let k = 0; k < passos || estaResolvido(); k++) {
    const r = Math.floor(vazio / N), c = vazio % N, vizinhos = [];
    if (r > 0) vizinhos.push(vazio - N); if (r < N - 1) vizinhos.push(vazio + N); if (c > 0) vizinhos.push(vazio - 1); if (c < N - 1) vizinhos.push(vazio + 1);
    const opc = vizinhos.filter((v) => v !== anterior), alvo = opc[ri(0, opc.length - 1)];
    pos[vazio] = pos[alvo]; pos[alvo] = N * N - 1; anterior = vazio; vazio = alvo;
  }
}
const estaResolvido = () => pos.every((v, i) => v === i);

async function novo() {
  clearInterval(timer); timer = 0; seg0 = 0; mov = 0; ganhou = false; painel.esconder();
  $("#mov").textContent = 0; $("#tempo").textContent = "0:00"; const m = rec.get("qc." + N, 0); $("#rec").textContent = m || "–";
  img = await carregarImagem(); refEl.style.backgroundImage = `url("${img}")`;
  embaralhar(); montar();
}

function montar() {
  qc.innerHTML = ""; qc.style.setProperty("--n", N);
  for (let id = 0; id < N * N - 1; id++) {
    const b = h("button", "pc"); b.type = "button"; b.dataset.id = id; b.setAttribute("aria-label", "Peça " + (id + 1));
    b.style.backgroundImage = `url("${img}")`; b.style.backgroundSize = `${N * 100}% ${N * 100}%`;
    b.style.backgroundPosition = `${((id % N) / (N - 1)) * 100}% ${(Math.floor(id / N) / (N - 1)) * 100}%`;
    b.innerHTML = `<span>${id + 1}</span>`;
    b.addEventListener("click", () => tocar(pos.indexOf(id)));
    qc.appendChild(b);
  }
  posicionar();
}
function posicionar() {
  pos.forEach((id, i) => { if (id === N * N - 1) return; const b = qc.children[id]; b.style.setProperty("--x", i % N); b.style.setProperty("--y", Math.floor(i / N)); b.classList.toggle("certa", id === i); });
}

function tocar(i) {
  if (ganhou || i < 0) return;
  const r = Math.floor(i / N), c = i % N, vr = Math.floor(vazio / N), vc = vazio % N;
  if (r !== vr && c !== vc) { som.tom(200, 0.06, "triangle", 0.04); return; }
  if (!timer) timer = setInterval(() => { seg0++; $("#tempo").textContent = fmt(seg0); }, 1000);
  const passo = r === vr ? (c < vc ? 1 : -1) : (r < vr ? N : -N), dir = r === vr ? 1 : N;
  void dir;
  let k = vazio; while (k !== i) { const de = k - passo; pos[k] = pos[de]; k = de; }
  pos[i] = N * N - 1; vazio = i;
  mov++; $("#mov").textContent = mov; som.tom(420, 0.06, "triangle", 0.05); posicionar();
  if (estaResolvido()) ganhar();
}
addEventListener("keydown", (e) => {
  const mapa = { ArrowLeft: [0, 1], ArrowRight: [0, -1], ArrowUp: [1, 0], ArrowDown: [-1, 0] }, d = mapa[e.key]; if (!d) return;
  const r = Math.floor(vazio / N) + d[0], c = (vazio % N) + d[1]; if (r < 0 || r >= N || c < 0 || c >= N) return;
  e.preventDefault(); tocar(r * N + c);
});

function ganhar() {
  ganhou = true; clearInterval(timer); timer = 0; vibrar(60); som.vitoria();
  const ultimo = qc.querySelector(".pc.certa"); void ultimo; qc.classList.add("completo");
  const e = mov <= N * N * 3.5 ? 3 : mov <= N * N * 7 ? 2 : 1, ant = rec.get("qc." + N, 0), novoRec = !ant || mov < ant; if (novoRec) rec.set("qc." + N, mov);
  $("#rec").textContent = Math.min(ant || mov, mov);
  setTimeout(() => {
    painel.mostrar(`<h2>Completo</h2>${estrelas(e)}<p>${mov} movimentos em ${fmt(seg0)}.${novoRec ? " Novo recorde." : ""}</p><button class="btn" id="outra" type="button">Outra vez</button>`);
    $("#outra", q).addEventListener("click", novo);
  }, 900);
}

function miniaturas() {
  const box = $("#thumbs"); box.innerHTML = "";
  if (lista.length < 2) return;
  lista.forEach((p, i) => {
    const b = h("button", "th"); b.type = "button"; b.setAttribute("aria-label", "Usar fotografia: " + (p.title || i + 1)); b.setAttribute("aria-pressed", String(i === fonte));
    b.style.backgroundImage = `url("${p.src}")`;
    b.addEventListener("click", () => { fonte = i; rec.set("qc.foto", i); miniaturas(); novo(); });
    box.appendChild(b);
  });
}
(async () => { lista = await fotos(); fonte = Math.min(rec.get("qc.foto", 0), Math.max(0, lista.length - 1)); miniaturas(); novo(); })();
