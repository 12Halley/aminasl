// Cartas "Open When". letters/{id} = metadados; letterBodies/{id} = texto (protegido pelas regras até à hora de desbloqueio)
import { exigirLogin, db, UIDS, ehHalley, msgErro } from "./firebase.js";
import { collection, query, where, onSnapshot, getDocs, getDoc, setDoc, doc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const SELO_LANTERNA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.5h6"/><path d="M8.5 5.5h7c1.8 2.4 2.5 4.6 2.5 7s-.7 4.6-2.5 7h-7C6.7 17.1 6 14.9 6 12.5s.7-4.6 2.5-7z"/><path d="M10 22h4"/></svg>';
const SELO_CADEADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
const $ = (id) => document.getElementById(id);
const user = await exigirLogin();
const halley = ehHalley(user);
if (halley) $("admLink").hidden = false;

let letters = [], abertas = new Set(), bloqueadas = -1;
const fmt = (ms) => new Date(ms).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
const estaBloq = (l) => !!l.unlockAt && l.unlockAt > Date.now();

async function carregarAbertas() {
  try {
    // A Amina lê o seu estado; o Halley vê quais a Amina já abriu.
    const s = await getDocs(collection(db, "users", halley ? UIDS.amina : user.uid, "opened"));
    abertas = new Set(s.docs.map((d) => d.id));
  } catch (e) { /* o estado "aberta" é opcional */ }
}

function render() {
  const ul = $("envs"), est = $("estado");
  ul.innerHTML = "";
  bloqueadas = letters.filter(estaBloq).length;
  est.hidden = letters.length > 0;
  if (!letters.length) { est.className = "estado"; est.textContent = halley ? "Ainda não criaste cartas. Usa «Gerir cartas»." : "Ainda não há cartas publicadas."; return; }
  letters.forEach((l) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    const bloq = estaBloq(l);
    b.type = "button";
    b.className = "env" + (bloq ? " bloq" : "") + (abertas.has(l.id) ? " aberta" : "");
    b.setAttribute("aria-label", l.title + (bloq ? " (bloqueada até " + fmt(l.unlockAt) + ")" : ""));
    const sub = bloq ? "Abre em " + fmt(l.unlockAt) : (!l.published ? "Rascunho" : (halley && abertas.has(l.id) ? "Aberta pela Amina" : l.condition));
    b.innerHTML = '<span class="corpo"></span><span class="aba"></span><span class="selo"></span><span class="txt"></span>';
    b.querySelector(".selo").innerHTML = bloq ? SELO_CADEADO : SELO_LANTERNA;
    const t = b.querySelector(".txt"); t.append(l.title);
    if (sub) { const s = document.createElement("small"); s.textContent = sub; t.appendChild(s); }
    b.addEventListener("click", () => abrir(l, b));
    li.appendChild(b); ul.appendChild(li);
  });
}

async function abrir(l, btn) {
  if (estaBloq(l) && !halley) {
    btn.classList.remove("treme"); void btn.offsetWidth; btn.classList.add("treme");
    alert("Esta carta só abre em " + fmt(l.unlockAt) + ".");
    return;
  }
  btn.classList.add("aberta");
  let texto;
  try {
    const s = await getDoc(doc(db, "letterBodies", l.id));
    texto = s.exists() ? s.data().body : "Esta carta ainda não tem texto.";
  } catch (e) {
    btn.classList.remove("aberta");
    alert(e.code === "permission-denied" ? "Ainda não é a hora de abrir esta carta." : msgErro(e));
    return;
  }
  setTimeout(() => {
    $("mTit").textContent = l.title;
    $("mCond").textContent = l.condition || "";
    $("mTxt").textContent = texto;
    $("modal").classList.add("on"); document.body.style.overflow = "hidden";
    $("mFechar").focus();
  }, 450);
  if (!halley && !abertas.has(l.id)) {
    abertas.add(l.id);
    setDoc(doc(db, "users", user.uid, "opened", l.id), { openedAt: serverTimestamp() }).catch(() => {});
  }
}
function fechar() { $("modal").classList.remove("on"); document.body.style.overflow = ""; render(); }
$("mFechar").addEventListener("click", fechar);
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") fechar(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && $("modal").classList.contains("on")) fechar(); });

await carregarAbertas();
const col = collection(db, "letters");
onSnapshot(halley ? query(col) : query(col, where("published", "==", true)), (snap) => {
  letters = snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, title: x.title || "", condition: x.condition || "", order: +x.order || 0,
      published: !!x.published, unlockAt: x.unlockAt ? x.unlockAt.toMillis() : 0 };
  }).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  render();
}, (e) => { const s = $("estado"); s.hidden = false; s.className = "estado erro"; s.textContent = msgErro(e); });

// Desbloqueio automático quando a hora chega
setInterval(() => { if (letters.filter(estaBloq).length !== bloqueadas && !$("modal").classList.contains("on")) render(); }, 15000);
