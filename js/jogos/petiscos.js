// Pegador de Petiscos — apanha peixes, evita ouriços, usa lanternas para abrandar o tempo.
import { $, h, rec, veu, canvasDPR, ciclo, clamp, rnd, som, botaoSom, vibrar } from "./util.js";

const LW = 360, LH = 470, BASE = LH - 18, TAU = Math.PI * 2;
const app = $("#app");
app.innerHTML = `
  <div class="g-bar">
    <div class="grp">
      <div class="stat"><b id="pts">0</b><span>Pontos</span></div>
      <div class="stat"><b id="vid">3</b><span>Vidas</span></div>
      <div class="stat"><b id="rec">0</b><span>Recorde</span></div>
    </div>
    <div id="som"></div>
  </div>
  <div class="quadro" id="q"><canvas id="cv" style="width:100%"></canvas></div>
  <p class="g-nota">Peixe douradinho vale mais. A lanterna abranda o tempo. Setas ou A/D no computador.</p>`;
$("#som").appendChild(botaoSom());

const cv = $("#cv"), q = $("#q");
let c, esc = 1, st;
const painel = veu(q);

function medir() {
  const w = Math.min(q.clientWidth || 360, 520), hh = Math.round(w * LH / LW);
  cv.style.height = hh + "px";
  c = canvasDPR(cv, w, hh); esc = w / LW; c.scale(esc, esc);
}
addEventListener("resize", () => { medir(); if (st && !lacos.ativo) desenhar(); });

function novo() {
  st = { x: LW / 2, tx: LW / 2, pts: 0, vidas: 3, combo: 0, nivel: 1, itens: [], parts: [], textos: [], t: 0, spawn: 0.6, lento: 0, tremer: 0, pausa: false, fim: false, teclas: { l: 0, r: 0 } };
  atualizarHud();
}
function mult() { return 1 + Math.min(4, Math.floor(st.combo / 5)); }
function atualizarHud() {
  $("#pts").textContent = st.pts; $("#vid").textContent = st.vidas; $("#rec").textContent = Math.max(rec.get("petiscos"), st.pts);
}

function gerar() {
  const n = st.nivel, r = Math.random();
  const hazard = Math.min(0.34, 0.14 + n * 0.02);
  let tipo = "peixe";
  if (r < hazard) tipo = "ourico";
  else if (r < hazard + 0.06) tipo = "ouro";
  else if (r < hazard + 0.06 + 0.035 && st.lento <= 0) tipo = "lanterna";
  const raio = tipo === "lanterna" ? 13 : tipo === "ourico" ? 14 : 12;
  st.itens.push({ tipo, x: rnd(raio + 6, LW - raio - 6), y: -20, r: raio, v: 120 + n * 14 + rnd(0, 45), ph: rnd(0, TAU), rot: rnd(-0.4, 0.4) });
}

function faiscas(x, y, cor, n = 10) {
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(30, 120); st.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, vida: rnd(0.4, 0.8), max: 0.8, cor }); }
}
function texto(x, y, t, cor) { st.textos.push({ x, y, t, vida: 0.9, cor }); }

function atualizar(dt) {
  st.t += dt;
  const k = st.teclas; if (k.l || k.r) st.tx = clamp(st.tx + (k.r - k.l) * 400 * dt, 28, LW - 28);
  st.x += (st.tx - st.x) * Math.min(1, dt * 16);
  st.nivel = 1 + Math.floor(st.pts / 150);
  if (st.lento > 0) st.lento = Math.max(0, st.lento - dt);
  const tempo = st.lento > 0 ? 0.5 : 1;
  st.spawn -= dt * tempo;
  if (st.spawn <= 0) { gerar(); st.spawn = Math.max(0.36, 0.95 - st.nivel * 0.05) * rnd(0.75, 1.25); }
  for (const it of st.itens) it.y += it.v * dt * tempo;
  // colisões
  for (let i = st.itens.length - 1; i >= 0; i--) {
    const it = st.itens[i];
    if (Math.abs(it.x - st.x) < 36 && it.y > BASE - 74 && it.y < BASE - 8) { apanhar(it); st.itens.splice(i, 1); continue; }
    if (it.y > LH + 20) {
      if (it.tipo === "peixe" || it.tipo === "ouro") { if (st.combo > 2) texto(it.x, LH - 30, "perdido", "rgba(242,232,213,.6)"); st.combo = 0; }
      st.itens.splice(i, 1);
    }
  }
  for (const p of st.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.vida -= dt; }
  st.parts = st.parts.filter((p) => p.vida > 0);
  for (const t of st.textos) { t.y -= 34 * dt; t.vida -= dt; }
  st.textos = st.textos.filter((t) => t.vida > 0);
  if (st.tremer > 0) st.tremer = Math.max(0, st.tremer - dt);
}

function apanhar(it) {
  if (it.tipo === "ourico") {
    st.vidas--; st.combo = 0; st.tremer = 0.35; faiscas(it.x, it.y, "#e8908a", 14); vibrar(80); som.tom(150, 0.25, "sawtooth", 0.08);
    texto(st.x, BASE - 80, "ai", "#e8908a");
    if (st.vidas <= 0) terminar();
  } else if (it.tipo === "lanterna") {
    st.lento = 6; st.combo++; st.pts += 20; faiscas(it.x, it.y, "#ffd79a", 16); texto(st.x, BASE - 80, "tempo lento", "#f8d99c"); som.tom(880, 0.35, "sine", 0.1); som.tom(1175, 0.4, "sine", 0.08, 0.08);
  } else {
    st.combo++;
    const ganho = (it.tipo === "ouro" ? 50 : 10) * mult();
    st.pts += ganho; faiscas(it.x, it.y, it.tipo === "ouro" ? "#f2bb62" : "#d7cdf2", it.tipo === "ouro" ? 16 : 8);
    texto(st.x, BASE - 80, "+" + ganho, it.tipo === "ouro" ? "#f8d99c" : "#f2e8d5");
    som.tom(520 + Math.min(st.combo, 20) * 22, 0.14, "triangle", 0.09);
  }
  atualizarHud();
}

/* ---------- Desenho ---------- */
function peixe(x, y, r, rot, cor, brilho) {
  c.save(); c.translate(x, y); c.rotate(rot);
  if (brilho) { const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 2.6); g.addColorStop(0, "rgba(242,187,98,.45)"); g.addColorStop(1, "rgba(242,187,98,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 2.6, 0, TAU); c.fill(); }
  c.fillStyle = cor;
  c.beginPath(); c.ellipse(0, 0, r, r * 0.58, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-r * 0.8, 0); c.lineTo(-r * 1.55, -r * 0.62); c.lineTo(-r * 1.55, r * 0.62); c.closePath(); c.fill();
  c.fillStyle = "#0b0e22"; c.beginPath(); c.arc(r * 0.45, -r * 0.1, r * 0.1, 0, TAU); c.fill();
  c.restore();
}
function ourico(x, y, r, t) {
  c.save(); c.translate(x, y); c.rotate(t * 1.4);
  c.strokeStyle = "#e8908a"; c.lineWidth = 2; c.lineCap = "round";
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); c.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); c.stroke(); }
  c.fillStyle = "#2a1236"; c.strokeStyle = "rgba(232,144,138,.8)"; c.lineWidth = 1.5;
  c.beginPath(); c.arc(0, 0, r * 0.78, 0, TAU); c.fill(); c.stroke();
  c.restore();
}
function lanterna(x, y, r, t) {
  const g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, "rgba(255,190,100,.5)"); g.addColorStop(1, "rgba(255,190,100,0)");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x - r * 0.45, y + r * 0.8);
  c.bezierCurveTo(x - r * 0.95, y + r * 0.3, x - r * 0.95, y - r * 0.6, x - r * 0.45, y - r * 0.85);
  c.quadraticCurveTo(x, y - r * 1.0, x + r * 0.45, y - r * 0.85);
  c.bezierCurveTo(x + r * 0.95, y - r * 0.6, x + r * 0.95, y + r * 0.3, x + r * 0.45, y + r * 0.8); c.closePath();
  const f = c.createLinearGradient(0, y - r, 0, y + r); f.addColorStop(0, "#ffcd87"); f.addColorStop(1, "#fff0c4"); c.fillStyle = f; c.fill();
}
function gato(x, y, t) {
  c.save(); c.translate(x, y); c.lineJoin = "round"; c.lineCap = "round";
  c.strokeStyle = "#f2bb62"; c.lineWidth = 1.6; c.fillStyle = "#151a47";
  c.beginPath(); c.moveTo(24, -6); c.bezierCurveTo(50, -6, 52, -34, 40, -40 + Math.sin(t * 3) * 4); c.stroke();
  c.beginPath(); c.ellipse(0, -14, 27, 15, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.arc(0, -40, 17, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-15.5, -49); c.lineTo(-14, -67); c.lineTo(-3, -55); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(15.5, -49); c.lineTo(14, -67); c.lineTo(3, -55); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#f8d99c"; c.beginPath(); c.ellipse(-6.5, -41, 2.2, 3.2, 0, 0, TAU); c.ellipse(6.5, -41, 2.2, 3.2, 0, 0, TAU); c.fill();
  c.strokeStyle = "rgba(242,232,213,.55)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-10, -35); c.lineTo(-24, -37); c.moveTo(-10, -32); c.lineTo(-23, -30); c.moveTo(10, -35); c.lineTo(24, -37); c.moveTo(10, -32); c.lineTo(23, -30); c.stroke();
  c.restore();
}

function desenhar() {
  c.clearRect(0, 0, LW, LH);
  c.save();
  if (st.tremer > 0) c.translate(rnd(-3, 3), rnd(-3, 3));
  // chão com brilho
  const g = c.createLinearGradient(0, LH - 60, 0, LH); g.addColorStop(0, "rgba(242,187,98,0)"); g.addColorStop(1, "rgba(242,187,98,.12)");
  c.fillStyle = g; c.fillRect(0, LH - 60, LW, 60);
  c.strokeStyle = "rgba(238,222,190,.22)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, LH - 17.5); c.lineTo(LW, LH - 17.5); c.stroke();
  for (const it of st.itens) {
    const rot = it.rot + Math.sin(st.t * 3 + it.ph) * 0.25;
    if (it.tipo === "peixe") peixe(it.x, it.y, it.r, rot, "#d7cdf2", false);
    else if (it.tipo === "ouro") peixe(it.x, it.y, it.r, rot, "#f2bb62", true);
    else if (it.tipo === "ourico") ourico(it.x, it.y, it.r, st.t + it.ph);
    else lanterna(it.x, it.y, it.r, st.t);
  }
  gato(st.x, BASE, st.t);
  for (const p of st.parts) { c.globalAlpha = Math.max(0, p.vida / p.max); c.fillStyle = p.cor; c.beginPath(); c.arc(p.x, p.y, 2, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  c.font = "italic 500 17px 'Bodoni Moda',serif"; c.textAlign = "center";
  for (const t of st.textos) { c.globalAlpha = Math.min(1, t.vida * 1.6); c.fillStyle = t.cor; c.fillText(t.t, t.x, t.y); }
  c.globalAlpha = 1;
  // HUD no canvas
  c.textAlign = "left"; c.fillStyle = "rgba(242,232,213,.5)"; c.font = "500 12px 'Hanken Grotesk',sans-serif";
  c.fillText("Nível " + st.nivel, 12, 22);
  if (mult() > 1) { c.fillStyle = "#f8d99c"; c.font = "italic 500 22px 'Bodoni Moda',serif"; c.fillText("×" + mult(), 12, 48); }
  if (st.lento > 0) { c.fillStyle = "rgba(242,187,98,.8)"; c.fillRect(0, 0, LW * (st.lento / 6), 3); }
  c.restore();
}

const lacos = ciclo((dt) => { atualizar(dt); desenhar(); });

function terminar() {
  st.fim = true; lacos.parar(); desenhar();
  const melhor = Math.max(rec.get("petiscos"), st.pts), novoRec = st.pts > rec.get("petiscos"); rec.set("petiscos", melhor);
  atualizarHud(); som.tom(196, 0.5, "sine", 0.1); 
  painel.mostrar(`<h2>${novoRec && st.pts > 0 ? "Novo recorde" : "Fim de jogo"}</h2><div class="big">${st.pts}</div><p>Nível ${st.nivel}. Recorde: ${melhor}.</p><button class="btn" id="de-novo" type="button">Jogar outra vez</button>`);
  $("#de-novo", q).addEventListener("click", iniciar);
}
function iniciar() { novo(); painel.esconder(); lacos.ligar(); }
function pausar(v) {
  if (st.fim || !lacos.ativo && !st.pausa) return;
  if (v) { st.pausa = true; lacos.parar(); painel.mostrar('<h2>Pausa</h2><button class="btn" id="cont" type="button">Continuar</button>'); $("#cont", q).addEventListener("click", () => pausar(false)); }
  else { st.pausa = false; painel.esconder(); lacos.ligar(); }
}

/* ---------- Entrada ---------- */
function ponteiro(e) { const r = cv.getBoundingClientRect(); st.tx = clamp(((e.clientX - r.left) / r.width) * LW, 28, LW - 28); }
cv.style.touchAction = "none";
cv.addEventListener("pointermove", (e) => { if (st && lacos.ativo) ponteiro(e); });
cv.addEventListener("pointerdown", (e) => { if (st && lacos.ativo) ponteiro(e); });
addEventListener("keydown", (e) => {
  if (!st) return;
  const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") { st.teclas.l = 1; e.preventDefault(); }
  else if (k === "arrowright" || k === "d") { st.teclas.r = 1; e.preventDefault(); }
  else if (k === "p" || k === "escape") pausar(!st.pausa);
});
addEventListener("keyup", (e) => {
  if (!st) return; const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") st.teclas.l = 0; else if (k === "arrowright" || k === "d") st.teclas.r = 0;
});
document.addEventListener("visibilitychange", () => { if (document.hidden && lacos.ativo) pausar(true); });

medir(); novo(); desenhar();
painel.mostrar(`<h2>Pegador de Petiscos</h2><p>Arrasta para mover a gata e apanha os peixes.</p><button class="btn" id="ini" type="button">Começar</button>`);
$("#ini", q).addEventListener("click", iniciar);
