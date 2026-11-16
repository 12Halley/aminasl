// Forca — categorias, frases com espaços, letras acentuadas tratadas, pista, teclado físico e sequência de vitórias.
import { $, h, rec, seg, veu, shuffle, norm, som } from "./util.js";

const CATS = {
  gatos: ["Gatos", ["BIGODE", "RONRONAR", "ARRANHAR", "FELINO", "GATINHO", "PETISCO", "NOVELO", "SOFÁ", "CAIXA DE PAPELÃO", "SIAMÊS", "PATINHAS"]],
  anime: ["Anime", ["MANGÁ", "OTAKU", "SHONEN", "NARUTO", "KAWAII", "SENPAI", "TANJIRO", "NEZUKO", "ROMANTIC KILLER", "SPY X FAMILY", "DEMON SLAYER", "SEVEN DEADLY SINS", "MELIODAS", "SHINICHI KUDO"]],
  amor: ["Amor", ["ABRAÇO", "CARINHO", "SAUDADE", "CORAÇÃO", "BEIJO", "RAPUNZEL", "LANTERNA", "ESTRELA", "PARA SEMPRE", "MINHA PRINCESA", "TORRE ENCANTADA"]],
  musica: ["Música", ["MELODIA", "GUITARRA", "PIANO", "CANÇÃO", "RITMO", "VIOLINO", "CONCERTO", "REFRÃO", "LAUFEY", "BEWITCHED", "BTS", "BOSSA NOVA"]],
};
const MAX = 7;
const app = $("#app");
app.innerHTML = `
  <div class="g-row"><div id="cat"></div></div>
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="erros">0/${MAX}</b><span>Erros</span></div>
    <div class="stat"><b id="seq">0</b><span>Sequência</span></div>
    <div class="stat"><b id="rec">0</b><span>Recorde</span></div></div>
    <button class="btn ghost small" id="pista" type="button">Pista</button></div>
  <div class="quadro fc-q" id="q">
    <svg class="forca" viewBox="0 0 120 130" aria-hidden="true">
      <g class="base"><path d="M12 124h72M30 124V10h56v16"/></g>
      <path class="p" d="M30 36l16-16" /><circle class="p" cx="86" cy="36" r="10"/><path class="p" d="M86 46v36"/><path class="p" d="M86 54l-14 14"/><path class="p" d="M86 54l14 14"/><path class="p" d="M86 82l-12 22"/><path class="p" d="M86 82l12 22"/>
    </svg>
    <div class="palavra" id="pal" aria-live="polite"></div></div>
  <div class="teclado" id="kb"></div>
  <p class="g-msg" id="msg" aria-live="polite">&nbsp;</p>`;

let cat = rec.get("forca.cat", "anime"), palavra = "", certas = new Set(), erradas = new Set(), fim = false, seq = rec.get("forca.seq", 0), usadas = [];
const q = $("#q"), painel = veu(q), pal = $("#pal"), msg = $("#msg"), pecas = [...q.querySelectorAll(".p")];
seg($("#cat"), Object.entries(CATS).map(([k, v]) => [k, v[0]]), cat, (v) => { cat = v; rec.set("forca.cat", v); usadas = []; seq = 0; novo(); }, "Categoria");

const kb = $("#kb");
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l) => { const b = h("button"); b.type = "button"; b.textContent = l; b.dataset.l = l; b.addEventListener("click", () => tentar(l)); kb.appendChild(b); });

function novo() {
  fim = false; certas = new Set(); erradas = new Set(); painel.esconder(); msg.innerHTML = "&nbsp;";
  const todas = CATS[cat][1]; if (usadas.length >= todas.length) usadas = [];
  palavra = shuffle(todas.filter((w) => !usadas.includes(w)))[0]; usadas.push(palavra);
  kb.querySelectorAll("button").forEach((b) => { b.disabled = false; b.className = ""; });
  $("#pista").disabled = false; atualizar();
}
function atualizar() {
  pal.innerHTML = [...palavra].map((ch) => ch === " " ? '<span class="esp"></span>' : `<span>${certas.has(norm(ch)) || fim ? ch : "&nbsp;"}</span>`).join("");
  if (fim && ![...palavra].every((ch) => ch === " " || certas.has(norm(ch)))) pal.querySelectorAll("span:not(.esp)").forEach((s, i) => { const ch = [...palavra].filter((x) => x !== " ")[i]; if (!certas.has(norm(ch))) s.classList.add("falhou"); });
  $("#erros").textContent = erradas.size + "/" + MAX; $("#seq").textContent = seq; $("#rec").textContent = rec.get("forca.rec");
  pecas.forEach((p, i) => p.classList.toggle("on", i < erradas.size));
}
function tentar(l) {
  if (fim || certas.has(l) || erradas.has(l)) return;
  const b = kb.querySelector(`[data-l="${l}"]`); b.disabled = true;
  if ([...norm(palavra)].includes(l)) { certas.add(l); b.classList.add("ok"); som.tom(600, 0.1, "triangle", 0.06); } else { erradas.add(l); b.classList.add("no"); som.tom(170, 0.15, "sawtooth", 0.05); }
  atualizar(); verificar();
}
function verificar() {
  const ganhou = [...norm(palavra)].every((ch) => ch === " " || certas.has(ch));
  if (!ganhou && erradas.size < MAX) return;
  fim = true; kb.querySelectorAll("button").forEach((b) => (b.disabled = true)); $("#pista").disabled = true;
  if (ganhou) { seq++; if (seq > rec.get("forca.rec")) rec.set("forca.rec", seq); som.vitoria(); }
  else seq = 0;
  rec.set("forca.seq", seq); atualizar();
  painel.mostrar(`<h2>${ganhou ? "Descobriste" : "Não foi desta"}</h2><p>${ganhou ? "A palavra era" : "A palavra era"} <strong style="font-family:var(--serif);font-size:1.4rem;color:var(--lume-2)">${palavra}</strong>.</p><button class="btn" id="outra" type="button">Outra palavra</button>`);
  $("#outra", q).addEventListener("click", novo);
}
$("#pista").addEventListener("click", () => {
  if (fim) return; const falta = [...new Set([...norm(palavra)].filter((ch) => ch !== " " && !certas.has(ch)))]; if (!falta.length) return;
  const l = falta[Math.floor(Math.random() * falta.length)]; msg.textContent = "Pista: a palavra tem a letra " + l + ". Custa um erro.";
  erradas.add("pista" + erradas.size); certas.add(l); kb.querySelector(`[data-l="${l}"]`).disabled = true; kb.querySelector(`[data-l="${l}"]`).classList.add("ok"); atualizar(); verificar();
});
addEventListener("keydown", (e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const l = norm(e.key); if (/^[A-Z]$/.test(l) && e.key.length === 1) tentar(l); });
novo();
