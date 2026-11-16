// Memória — pares de símbolos ou das fotografias da galeria.
import { $, h, rec, seg, veu, shuffle, fmt, estrelas, fotos, som, vibrar } from "./util.js";

const SIM = [
  ["lua", '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>'],
  ["estrela", '<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>'],
  ["lanterna", '<path d="M9 3.5h6"/><path d="M8.5 5.5h7c1.8 2.4 2.5 4.6 2.5 7s-.7 4.6-2.5 7h-7C6.7 17.1 6 14.9 6 12.5s.7-4.6 2.5-7z"/><path d="M10 22h4"/><path d="M12 11c1.4 1.4 1.8 2.4 0 4.2-1.8-1.8-1.4-2.8 0-4.2z"/>'],
  ["flor", '<circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="6.3" r="2.8"/><circle cx="12" cy="17.7" r="2.8"/><circle cx="6.3" cy="12" r="2.8"/><circle cx="17.7" cy="12" r="2.8"/>'],
  ["coração", '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>'],
  ["chave", '<circle cx="7.5" cy="12" r="3.5"/><path d="M11 12h10M18 12v3.5M21 12v2.5"/>'],
  ["coroa", '<path d="M4 18.5h16M4 18.5L3 8l5 4 4-7 4 7 5-4-1 10.5z"/>'],
  ["pena", '<path d="M20 4C11 4 5.5 9 5.5 16v4"/><path d="M20 4c-1 8-6 13.5-14 14.5"/><path d="M9.5 14.5h5"/>'],
  ["sol", '<circle cx="12" cy="12" r="4"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'],
  ["gota", '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>'],
  ["folha", '<path d="M5 19C5 9.5 10 5 20 5c0 10-5 15-14 15"/><path d="M5 19L14 10"/>'],
  ["anel", '<circle cx="12" cy="14.5" r="5.5"/><path d="M9.2 6.8L12 3l2.8 3.8-2.8 2.2z"/>'],
];
const NIVEIS = { facil: ["Fácil", 6], medio: ["Médio", 8], dificil: ["Difícil", 12] };

const app = $("#app");
app.innerHTML = `
  <div class="g-row"><div id="modo"></div><div id="nivel"></div></div>
  <div class="g-bar"><div class="grp">
    <div class="stat"><b id="jog">0</b><span>Jogadas</span></div>
    <div class="stat"><b id="tempo">0:00</b><span>Tempo</span></div>
    <div class="stat"><b id="rec">–</b><span>Recorde</span></div></div>
    <button class="btn ghost small" id="novo" type="button">Recomeçar</button></div>
  <div class="quadro" id="q"><div class="mem" id="mem"></div></div>
  <p class="g-msg" id="msg" aria-live="polite"></p>`;

let modo = rec.get("memoria.modo", "simbolos"), nivel = rec.get("memoria.nivel", "medio");
let lista = [], abertas = [], bloq = false, jog = 0, pares = 0, total = 0, seg0 = 0, timer = 0, fotosLista = null;
const q = $("#q"), mem = $("#mem"), painel = veu(q), msg = $("#msg");

const sModo = seg($("#modo"), [["simbolos", "Símbolos"], ["fotos", "Fotografias"]], modo, (v) => { modo = v; rec.set("memoria.modo", v); $("#nivel").hidden = v === "fotos"; novo(); }, "Modo");
const sNivel = seg($("#nivel"), Object.entries(NIVEIS).map(([k, v]) => [k, v[0]]), nivel, (v) => { nivel = v; rec.set("memoria.nivel", v); novo(); }, "Dificuldade");
$("#nivel").hidden = modo === "fotos";
$("#novo").addEventListener("click", novo);

const chaveRec = () => "memoria." + (modo === "fotos" ? "fotos" : nivel);

async function novo() {
  clearInterval(timer); timer = 0; seg0 = 0; jog = 0; pares = 0; abertas = []; bloq = false; msg.textContent = ""; painel.esconder();
  $("#jog").textContent = 0; $("#tempo").textContent = "0:00";
  let faces;
  if (modo === "fotos") {
    fotosLista = fotosLista || await fotos();
    if (fotosLista.length < 2) { mem.innerHTML = ""; msg.textContent = "São precisas pelo menos duas fotografias na galeria."; return; }
    faces = shuffle(fotosLista).slice(0, 10).map((p, i) => ({ id: "f" + i, foto: p.src, nome: p.title || "Fotografia" }));
  } else {
    const n = NIVEIS[nivel][1];
    faces = shuffle(SIM).slice(0, n).map(([nome, svg]) => ({ id: nome, svg, nome }));
  }
  total = faces.length;
  const baralho = shuffle([...faces, ...faces]);
  const cols = baralho.length % 4 === 0 ? 4 : 3;
  mem.style.setProperty("--cols", cols);
  mem.innerHTML = "";
  baralho.forEach((f, i) => {
    const b = h("button", "mc"); b.type = "button"; b.setAttribute("aria-label", "Carta virada para baixo"); b.dataset.i = i;
    b.innerHTML = '<span class="in"><span class="mc-b"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2z"/></svg></span><span class="mc-f"></span></span>';
    const fr = b.querySelector(".mc-f");
    if (f.foto) fr.style.backgroundImage = `url("${f.foto}")`;
    else fr.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${f.svg}</svg>`;
    b.addEventListener("click", () => virar(b, f));
    mem.appendChild(b);
  });
  const r = rec.get(chaveRec(), 0); $("#rec").textContent = r || "–";
}

function virar(b, f) {
  if (bloq || b.classList.contains("on") || b.classList.contains("par")) return;
  if (!timer) { seg0 = 0; timer = setInterval(() => { seg0++; $("#tempo").textContent = fmt(seg0); }, 1000); }
  b.classList.add("on"); b.setAttribute("aria-label", f.nome); som.tom(480, 0.08, "triangle", 0.05);
  abertas.push([b, f]);
  if (abertas.length < 2) return;
  jog++; $("#jog").textContent = jog;
  const [[b1, f1], [b2, f2]] = abertas; abertas = [];
  if (f1.id === f2.id) {
    pares++; [b1, b2].forEach((x) => x.classList.add("par")); vibrar(30); som.tom(660, 0.18, "sine", 0.08); som.tom(880, 0.22, "sine", 0.07, 0.08);
    if (pares === total) setTimeout(fim, 500);
  } else {
    bloq = true;
    setTimeout(() => { [b1, b2].forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-label", "Carta virada para baixo"); }); bloq = false; }, 850);
  }
}

function fim() {
  clearInterval(timer); timer = 0; som.vitoria();
  const e = jog <= total * 1.5 ? 3 : jog <= total * 2.3 ? 2 : 1;
  const ant = rec.get(chaveRec(), 0), novoRec = !ant || jog < ant; if (novoRec) rec.set(chaveRec(), jog);
  $("#rec").textContent = Math.min(ant || jog, jog);
  painel.mostrar(`<h2>Todos os pares</h2>${estrelas(e)}<p>${jog} jogadas em ${fmt(seg0)}.${novoRec ? " Novo recorde." : ""}</p><button class="btn" id="outra" type="button">Jogar outra vez</button>`);
  $("#outra", q).addEventListener("click", novo);
}
novo();
