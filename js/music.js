// Música de fundo persistente entre páginas. Ficheiro: assets/audio/musica.mp3
// Se o ficheiro não existir, o botão não aparece (sem erros visíveis).
const SRC = "assets/audio/musica.mp3";
const KEY = "amina.musica";
const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const gravar = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };

const audio = new Audio();
audio.loop = true;
audio.preload = "none";
audio.src = SRC;

const NOTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>';
const EQ = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';

const btn = document.createElement("button");
btn.className = "music";
btn.type = "button";
btn.hidden = true;
btn.setAttribute("aria-label", "Música");
btn.setAttribute("aria-pressed", "false");
document.body.appendChild(btn);

const pintar = (on) => { btn.innerHTML = on ? EQ : NOTA; btn.setAttribute("aria-pressed", String(on)); btn.title = on ? "Pausar música" : "Tocar música"; };
audio.addEventListener("error", () => { btn.hidden = true; });
audio.addEventListener("loadedmetadata", () => { btn.hidden = false; });
audio.addEventListener("canplay", () => { btn.hidden = false; }, { once: true });

async function tocar() {
  try { await audio.play(); pintar(true); gravar({ on: true, t: audio.currentTime }); return true; }
  catch { pintar(false); return false; }
}
function parar() { audio.pause(); pintar(false); gravar({ on: false, t: audio.currentTime }); }

btn.addEventListener("click", () => (audio.paused ? tocar() : parar()));
pintar(false);
audio.load(); // só metadados; confirma se o ficheiro existe

const est = ler();
if (est.t) audio.addEventListener("loadedmetadata", () => { try { audio.currentTime = est.t; } catch {} }, { once: true });
if (est.on) {
  // Browsers bloqueiam autoplay: retoma no primeiro toque/clique.
  tocar().then((ok) => {
    if (!ok) addEventListener("pointerdown", () => tocar(), { once: true });
  });
}
addEventListener("pagehide", () => { if (!audio.paused) gravar({ on: true, t: audio.currentTime }); });
