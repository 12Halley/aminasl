// Utilitários partilhados pelos jogos (módulo ES).
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = (a) => a[ri(0, a.length - 1)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
export const norm = (w) => w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

/** Cria um elemento: h("div","classe","<b>html</b>") */
export function h(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

/** Recordes e estado guardados no dispositivo. */
export const rec = {
  get(k, d = 0) { try { const v = JSON.parse(localStorage.getItem("amina.rec." + k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("amina.rec." + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("amina.rec." + k); } catch {} },
};

/** Controlo segmentado (escolha única). Devolve { set(valor) }. */
export function seg(container, opcoes, atual, aoMudar, rotulo = "") {
  container.classList.add("seg");
  container.setAttribute("role", "group");
  if (rotulo) container.setAttribute("aria-label", rotulo);
  const bs = opcoes.map(([v, txt]) => {
    const b = h("button"); b.type = "button"; b.textContent = txt; b.dataset.v = v;
    b.addEventListener("click", () => { marcar(v); aoMudar(v); });
    container.appendChild(b); return b;
  });
  const marcar = (v) => bs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(v))));
  marcar(atual);
  return { set: marcar };
}

/** Painel de fim de jogo / início sobre um .quadro. */
export function veu(quadro) {
  const v = h("div", "veu"); quadro.appendChild(v);
  return {
    mostrar(html) { v.innerHTML = html; v.classList.add("on"); const b = v.querySelector("button"); if (b) b.focus({ preventScroll: true }); },
    esconder() { v.classList.remove("on"); },
    get el() { return v; },
    get ativo() { return v.classList.contains("on"); },
  };
}

export const ESTRELA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>';
export const estrelas = (n, total = 3) => `<span class="estrelas" role="img" aria-label="${n} de ${total} estrelas">` +
  Array.from({ length: total }, (_, i) => `<span class="${i < n ? "on" : ""}">${ESTRELA}</span>`).join("") + "</span>";

/** Gestos de deslizar (4 direções). cb("up"|"down"|"left"|"right") */
export function deslizar(no, cb, min = 28) {
  let x0 = 0, y0 = 0, ativo = false;
  no.style.touchAction = "none";
  no.addEventListener("pointerdown", (e) => { ativo = true; x0 = e.clientX; y0 = e.clientY; });
  no.addEventListener("pointerup", (e) => {
    if (!ativo) return; ativo = false;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return;
    cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
  no.addEventListener("pointercancel", () => { ativo = false; });
}

/** Ciclo de animação com delta-time e pausa automática quando o separador fica em segundo plano. */
export function ciclo(fn) {
  let raf = 0, ultimo = 0, corre = false;
  const q = (t) => { if (!corre) return; raf = requestAnimationFrame(q); const dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t; fn(dt); };
  return {
    ligar() { if (corre) return; corre = true; ultimo = performance.now(); raf = requestAnimationFrame(q); },
    parar() { corre = false; cancelAnimationFrame(raf); },
    get ativo() { return corre; },
  };
}

/** Som suave (Web Audio). Só arranca depois de um gesto do utilizador. */
let ac = null;
export const som = {
  on: rec.get("som", true),
  tom(freq, dur = 0.18, tipo = "sine", vol = 0.12, atraso = 0) {
    if (!som.on) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const t = ac.currentTime + atraso, o = ac.createOscillator(), g = ac.createGain();
      o.type = tipo; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch {}
  },
  vitoria() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => som.tom(f, 0.4, "sine", 0.1, i * 0.11)); },
  alternar(b) { som.on = !som.on; rec.set("som", som.on); if (b) b.textContent = som.on ? "Som ligado" : "Som desligado"; },
};
export function botaoSom() {
  const b = h("button", "btn ghost small"); b.type = "button"; b.textContent = som.on ? "Som ligado" : "Som desligado";
  b.addEventListener("click", () => som.alternar(b)); return b;
}
export const vibrar = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };

/** Fotografias da galeria (data/fotos.json). */
export async function fotos() {
  try { const r = await fetch("data/fotos.json"); const j = await r.json(); return (j.photos || []).filter((p) => p.src); } catch { return []; }
}
/** Recorta uma fotografia ao centro (quadrado) e devolve um dataURL. */
export function quadrada(src, lado = 720) {
  return new Promise((ok, falha) => {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = c.height = lado;
        const s = Math.min(im.naturalWidth, im.naturalHeight), sx = (im.naturalWidth - s) / 2, sy = (im.naturalHeight - s) / 2;
        c.getContext("2d").drawImage(im, sx, sy, s, s, 0, 0, lado, lado);
        ok(c.toDataURL("image/jpeg", 0.88));
      } catch (e) { falha(e); }
    };
    im.onerror = falha; im.src = src;
  });
}
/** Aplica DPR a um canvas e devolve o contexto com coordenadas lógicas (w × h). */
export function canvasDPR(cv, w, h) {
  const d = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(w * d); cv.height = Math.round(h * d);
  const c = cv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); return c;
}
