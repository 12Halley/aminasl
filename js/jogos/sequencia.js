// Eco das Lanternas — repete a sequência de luzes e notas.
import { $, h, rec, veu, ri, som, botaoSom, vibrar } from "./util.js";

const NOTAS = [392, 440, 523.25, 659.25];
const NOMES = ["âmbar", "rosa", "lilás", "água"];
const app = $("#app");
app.innerHTML = `
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="ron">0</b><span>Ronda</span></div>
    <div class="stat"><b id="vid">3</b><span>Tentativas</span></div>
    <div class="stat"><b id="rec">0</b><span>Recorde</span></div></div><div id="som"></div></div>
  <div class="quadro eco" id="q"><div class="pads" id="pads"></div></div>
  <p class="g-msg" id="msg" aria-live="polite">&nbsp;</p>
  <p class="g-nota">Teclado: Q W / A S, ou 1 2 3 4.</p>`;
$("#som").appendChild(botaoSom());

const q = $("#q"), pads = $("#pads"), msg = $("#msg"), painel = veu(q);
let seq = [], pos = 0, vidas = 3, estado = "ocioso", tmo = [];
const botoes = NOMES.map((n, i) => {
  const b = h("button", "pad-l p" + i); b.type = "button"; b.setAttribute("aria-label", "Lanterna " + n);
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); toque(i); });
  pads.appendChild(b); return b;
});
const esperar = (fn, ms) => { const t = setTimeout(fn, ms); tmo.push(t); return t; };
const limpar = () => { tmo.forEach(clearTimeout); tmo = []; };

function acender(i, dur = 320) {
  const b = botoes[i]; b.classList.add("on"); som.tom(NOTAS[i], dur / 1000 + 0.15, "sine", 0.14);
  esperar(() => b.classList.remove("on"), dur);
}
function hud() { $("#ron").textContent = seq.length; $("#vid").textContent = vidas; $("#rec").textContent = rec.get("sequencia"); }

function proxima() { seq.push(ri(0, 3)); mostrar(); }
function mostrar() {
  estado = "mostrando"; pos = 0; hud(); msg.textContent = "Observa a sequência.";
  const passo = Math.max(300, 700 - seq.length * 30), dur = passo * 0.62;
  seq.forEach((n, k) => esperar(() => acender(n, dur), 700 + k * passo));
  esperar(() => { estado = "jogador"; msg.textContent = "A tua vez."; hud(); }, 700 + seq.length * passo);
}
function toque(i) {
  if (estado !== "jogador") return;
  if (i === seq[pos]) {
    acender(i, 200); pos++;
    if (pos === seq.length) {
      estado = "pausa"; const feito = seq.length; if (feito > rec.get("sequencia")) rec.set("sequencia", feito);
      hud(); msg.textContent = feito >= 5 && feito % 5 === 0 ? "Muito bem." : "Certo."; esperar(proxima, 900);
    }
  } else {
    estado = "pausa"; vidas--; botoes.forEach((b) => b.classList.add("erro")); som.tom(130, 0.45, "sawtooth", 0.09); vibrar(120);
    esperar(() => botoes.forEach((b) => b.classList.remove("erro")), 450);
    if (vidas <= 0) { esperar(fim, 700); } else { msg.textContent = "Errou. Vê outra vez."; hud(); esperar(mostrar, 1100); }
  }
}
function fim() {
  estado = "fim"; const feito = seq.length - 1, r = rec.get("sequencia");
  if (feito > r) rec.set("sequencia", feito);
  hud();
  painel.mostrar(`<h2>Fim</h2><div class="big">${Math.max(0, feito)}</div><p>rondas completas. Recorde: ${Math.max(r, feito)}.</p><button class="btn" id="de-novo" type="button">Jogar outra vez</button>`);
  $("#de-novo", q).addEventListener("click", iniciar);
}
function iniciar() { limpar(); painel.esconder(); seq = []; vidas = 3; msg.innerHTML = "&nbsp;"; proxima(); }

const MAPA = { q: 0, w: 1, a: 2, s: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
addEventListener("keydown", (e) => { const i = MAPA[e.key.toLowerCase()]; if (i != null && !e.repeat) toque(i); });
hud();
painel.mostrar(`<h2>Eco das Lanternas</h2><p>Cada ronda acrescenta uma luz à sequência.</p><button class="btn" id="ini" type="button">Começar</button>`);
$("#ini", q).addEventListener("click", iniciar);
