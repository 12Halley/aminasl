// Galeria: lê data/fotos.json. Para adicionar fotos: copiar a imagem para assets/img/galeria/
// e acrescentar uma entrada em data/fotos.json (ver README).
const $ = (id) => document.getElementById(id);
const mosaico = $("mosaico"), albunsEl = $("albuns"), vazio = $("vazio");
const lb = $("lb"), lbImg = $("lbImg"), lbLeg = $("lbLeg"), lbCont = $("lbCont");

let todas = [], visiveis = [], atual = 0, albumSel = "Todas", ultimoFoco = null;

async function carregar() {
  try {
    const r = await fetch("data/fotos.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    todas = d.photos || [];
  } catch (e) {
    vazio.textContent = "Não foi possível carregar as fotografias. Recarrega a página.";
    vazio.hidden = false;
    return;
  }
  const albuns = [...new Set(todas.map((p) => p.album).filter(Boolean))];
  if (albuns.length > 1) montarChips(["Todas", ...albuns]);
  filtrar("Todas");
}

function montarChips(lista) {
  albunsEl.hidden = false;
  albunsEl.innerHTML = "";
  lista.forEach((nome) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = nome;
    b.setAttribute("aria-pressed", String(nome === albumSel));
    b.addEventListener("click", () => {
      albunsEl.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      filtrar(nome);
    });
    albunsEl.appendChild(b);
  });
}

function filtrar(nome) {
  albumSel = nome;
  visiveis = nome === "Todas" ? todas : todas.filter((p) => p.album === nome);
  mosaico.innerHTML = "";
  vazio.hidden = visiveis.length > 0;
  visiveis.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "foto";
    b.setAttribute("aria-label", "Abrir: " + p.title);
    const img = document.createElement("img");
    img.src = p.src; img.alt = p.title; img.loading = "lazy"; img.decoding = "async";
    if (p.w && p.h) { img.width = p.w; img.height = p.h; }
    img.addEventListener("error", () => { b.hidden = true; });
    const leg = document.createElement("span");
    leg.className = "leg"; leg.textContent = p.title;
    b.append(img, leg);
    b.addEventListener("click", () => abrir(i, b));
    mosaico.appendChild(b);
  });
}

function mostrar() {
  const p = visiveis[atual];
  lbImg.src = p.src; lbImg.alt = p.title;
  lbLeg.innerHTML = "";
  lbLeg.append(p.title);
  if (p.date) { const s = document.createElement("small"); s.textContent = p.date; lbLeg.appendChild(s); }
  lbCont.textContent = `${atual + 1} / ${visiveis.length}`;
  // pré-carrega vizinhas
  [1, -1].forEach((d) => { const q = visiveis[(atual + d + visiveis.length) % visiveis.length]; if (q) new Image().src = q.src; });
}
function abrir(i, origem) {
  ultimoFoco = origem; atual = i; mostrar();
  lb.classList.add("aberta"); document.body.style.overflow = "hidden";
  $("lbX").focus();
}
function fechar() {
  lb.classList.remove("aberta"); document.body.style.overflow = "";
  if (ultimoFoco) ultimoFoco.focus();
}
function navegar(d) { atual = (atual + d + visiveis.length) % visiveis.length; mostrar(); }

$("lbX").addEventListener("click", fechar);
$("lbAnt").addEventListener("click", () => navegar(-1));
$("lbSeg").addEventListener("click", () => navegar(1));
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.id === "lbPalco") fechar(); });
addEventListener("keydown", (e) => {
  if (!lb.classList.contains("aberta")) return;
  if (e.key === "Escape") fechar();
  else if (e.key === "ArrowLeft") navegar(-1);
  else if (e.key === "ArrowRight") navegar(1);
  else if (e.key === "Tab") { // mantém o foco dentro do lightbox
    const f = [...lb.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }
});

// Gestos: deslizar para os lados navega; deslizar para baixo fecha.
let x0 = 0, y0 = 0, ativo = false;
const palco = $("lbPalco");
palco.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; ativo = true; });
palco.addEventListener("pointerup", (e) => {
  if (!ativo) return; ativo = false;
  const dx = e.clientX - x0, dy = e.clientY - y0;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) navegar(dx < 0 ? 1 : -1);
  else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) fechar();
});
palco.addEventListener("pointercancel", () => { ativo = false; });

carregar();
