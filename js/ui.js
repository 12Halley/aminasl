// Céu partilhado. Em todas as páginas: estrelas estáticas (barato, não distrai nos jogos).
// Na home (criarLanternas): estrelas a cintilar + lanternas a subir em profundidade, desenhadas num único canvas.
const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

let cv, cx, W = 0, H = 0, dpr = 1, raf = 0, animar = false, t0 = 0;
const estrelas = [], lanternas = [];

function montar() {
  if (cv) return;
  cv = document.createElement("canvas");
  cv.className = "sky";
  cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  cx = cv.getContext("2d");
  const n = innerWidth < 600 ? 70 : 130;
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    estrelas.push({ x: Math.random(), y: Math.random() * 0.92, r: r < 0.06 ? 1.7 : rnd(0.5, 1.25), a: rnd(0.25, 0.8), f: rnd(0.6, 1.8), p: rnd(0, TAU), cruz: r < 0.06 });
  }
  addEventListener("resize", ajustar);
  ajustar();
}

function ajustar() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!animar) desenhar(0);
}

function desenhaEstrelas(t) {
  for (const s of estrelas) {
    const a = s.a * (animar ? 0.62 + 0.38 * Math.sin(t * s.f + s.p) : 1);
    const x = s.x * W, y = s.y * H;
    cx.fillStyle = `rgba(255,244,222,${a})`;
    cx.beginPath(); cx.arc(x, y, s.r, 0, TAU); cx.fill();
    if (s.cruz) {
      cx.strokeStyle = `rgba(255,244,222,${a * 0.5})`; cx.lineWidth = 0.8;
      cx.beginPath(); cx.moveTo(x - 5, y); cx.lineTo(x + 5, y); cx.moveTo(x, y - 5); cx.lineTo(x, y + 5); cx.stroke();
    }
  }
}

function desenhaLanterna(l, t) {
  const idade = Math.min(1, Math.max(0, (t - l.nasce) / 3));
  const a = l.z * 0.85 * idade * (0.92 + 0.08 * Math.sin(t * 7 + l.p));
  if (a <= 0.01) return;
  const x = l.x + Math.sin(t * l.sw + l.p) * l.amp, y = l.y, w = l.s, h = l.s * 1.28;
  // halo
  cx.globalCompositeOperation = "lighter";
  const g = cx.createRadialGradient(x, y, 0, x, y, w * 2.4);
  g.addColorStop(0, `rgba(255,190,100,${0.34 * a})`); g.addColorStop(1, "rgba(255,190,100,0)");
  cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, w * 2.4, 0, TAU); cx.fill();
  cx.globalCompositeOperation = "source-over";
  // corpo de papel
  cx.beginPath();
  cx.moveTo(x - w * 0.3, y + h * 0.5);
  cx.bezierCurveTo(x - w * 0.62, y + h * 0.2, x - w * 0.62, y - h * 0.36, x - w * 0.3, y - h * 0.5);
  cx.quadraticCurveTo(x, y - h * 0.6, x + w * 0.3, y - h * 0.5);
  cx.bezierCurveTo(x + w * 0.62, y - h * 0.36, x + w * 0.62, y + h * 0.2, x + w * 0.3, y + h * 0.5);
  cx.closePath();
  const f = cx.createLinearGradient(0, y - h * 0.5, 0, y + h * 0.5);
  f.addColorStop(0, `rgba(255,205,135,${a * 0.9})`); f.addColorStop(0.6, `rgba(255,178,88,${a})`); f.addColorStop(1, `rgba(255,236,190,${a})`);
  cx.fillStyle = f; cx.fill();
  // nervuras e chama
  cx.strokeStyle = `rgba(120,60,20,${a * 0.22})`; cx.lineWidth = Math.max(0.6, w * 0.02);
  cx.beginPath(); cx.moveTo(x, y - h * 0.55); cx.lineTo(x, y + h * 0.5);
  cx.moveTo(x - w * 0.3, y - h * 0.5); cx.quadraticCurveTo(x - w * 0.2, y, x - w * 0.22, y + h * 0.5);
  cx.moveTo(x + w * 0.3, y - h * 0.5); cx.quadraticCurveTo(x + w * 0.2, y, x + w * 0.22, y + h * 0.5); cx.stroke();
  cx.globalCompositeOperation = "lighter";
  const fl = cx.createRadialGradient(x, y + h * 0.38, 0, x, y + h * 0.38, w * 0.4);
  fl.addColorStop(0, `rgba(255,248,220,${a})`); fl.addColorStop(1, "rgba(255,200,120,0)");
  cx.fillStyle = fl; cx.beginPath(); cx.arc(x, y + h * 0.38, w * 0.4, 0, TAU); cx.fill();
  cx.globalCompositeOperation = "source-over";
}

function desenhar(t) {
  cx.clearRect(0, 0, W, H);
  desenhaEstrelas(t);
  for (const l of lanternas) desenhaLanterna(l, t);
}

let ultimo = 0;
function quadro(agora) {
  raf = requestAnimationFrame(quadro);
  const t = (agora - t0) / 1000, dt = Math.min(0.05, (agora - ultimo) / 1000 || 0);
  ultimo = agora;
  for (const l of lanternas) {
    l.y -= l.v * dt;
    if (l.y < -l.s * 2) { l.y = H + l.s * 2; l.x = rnd(0.04, 0.96) * W; l.nasce = t; }
  }
  desenhar(t);
}
function parar() { cancelAnimationFrame(raf); raf = 0; }

export function criarCeu() { montar(); }

export function criarLanternas(qtd) {
  montar();
  const n = qtd || (innerWidth < 600 ? 11 : 18);
  for (let i = 0; i < n; i++) {
    const z = rnd(0.28, 1); // profundidade: pequeno e ténue = longe
    lanternas.push({ z, s: 12 + z * z * 40, x: rnd(0.04, 0.96) * innerWidth, y: rnd(0.15, 1.05) * innerHeight,
      v: 8 + z * 26, sw: rnd(0.25, 0.6), amp: rnd(6, 22) * z, p: rnd(0, TAU), nasce: rnd(0, 4) });
  }
  lanternas.sort((a, b) => a.z - b.z);
  if (reduz) { desenhar(10); return; }
  animar = true; t0 = performance.now(); ultimo = t0;
  quadro(t0);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) parar(); else if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(quadro); }
  });
}

criarCeu();
