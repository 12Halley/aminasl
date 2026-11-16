// Administração das cartas (só o Halley). As regras do Firestore também impedem qualquer outra conta de escrever.
import { exigirLogin, db, msgErro } from "./firebase.js";
import { collection, onSnapshot, getDoc, doc, writeBatch, serverTimestamp, Timestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
await exigirLogin({ apenasHalley: true });

const col = collection(db, "letters");
let letters = [], atual = null; // atual = carta em edição (null = nova)

function aviso(t, tipo) { const a = $("aviso"); a.textContent = t || ""; a.dataset.tipo = tipo || ""; a.hidden = !t; if (t) a.scrollIntoView({ block: "nearest" }); }
const paraInput = (ms) => { if (!ms) return ""; const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

function lista() {
  const ul = $("lista"); ul.innerHTML = "";
  if (!letters.length) { const li = document.createElement("li"); li.className = "muted"; li.textContent = "Ainda não há cartas."; ul.appendChild(li); return; }
  letters.forEach((l) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.className = "item"; b.setAttribute("aria-current", String(atual && atual.id === l.id));
    const t = document.createElement("span"); t.textContent = l.title;
    const tag = document.createElement("span");
    tag.className = "tag" + (l.published ? " pub" : "");
    tag.textContent = l.published ? (l.unlockAt > Date.now() ? "Agendada" : "Publicada") : "Rascunho";
    b.append(t, tag); b.addEventListener("click", () => editar(l)); li.appendChild(b); ul.appendChild(li);
  });
}
function limpar() {
  atual = null; $("form").reset();
  $("ordem").value = (letters.reduce((m, l) => Math.max(m, l.order), 0) || 0) + 1;
  $("apagar").hidden = true; aviso(""); lista();
}
async function editar(l) {
  atual = l; aviso("A carregar…", "ok");
  $("titulo").value = l.title; $("cond").value = l.condition;
  $("ordem").value = l.order; $("pub").checked = l.published; $("desbloqueio").value = paraInput(l.unlockAt);
  $("apagar").hidden = false; $("texto").value = "";
  try { const s = await getDoc(doc(db, "letterBodies", l.id)); $("texto").value = s.exists() ? s.data().body : ""; aviso(""); }
  catch (e) { aviso(msgErro(e), "erro"); }
  lista(); $("form").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const title = $("titulo").value.trim(), condition = $("cond").value.trim(), body = $("texto").value;
  if (!title) return aviso("Escreve um título.", "erro");
  if (body.length > 20000) return aviso("O texto é demasiado longo.", "erro");
  const un = $("desbloqueio").value;
  const published = $("pub").checked;
  if (published && !body.trim() && !confirm("A carta está publicada mas sem texto. Continuar?")) return;
  const ref = atual ? doc(db, "letters", atual.id) : doc(col);
  const meta = {
    title, condition, order: parseInt($("ordem").value, 10) || 0, published,
    unlockAt: un ? Timestamp.fromDate(new Date(un)) : null,
    createdAt: atual && atual.createdAt ? atual.createdAt : serverTimestamp(), updatedAt: serverTimestamp(),
  };
  $("guardar").disabled = true;
  try {
    const b = writeBatch(db);
    b.set(ref, meta); b.set(doc(db, "letterBodies", ref.id), { body, updatedAt: serverTimestamp() });
    await b.commit();
    aviso(published ? (un ? "Guardada e agendada." : "Guardada e publicada.") : "Guardada como rascunho.", "ok");
    if (!atual) { atual = { id: ref.id }; $("apagar").hidden = false; }
  } catch (e) { aviso("Não foi possível guardar: " + msgErro(e), "erro"); }
  $("guardar").disabled = false;
});

$("apagar").addEventListener("click", async () => {
  if (!atual || !confirm("Apagar esta carta de forma definitiva?")) return;
  try {
    const b = writeBatch(db); b.delete(doc(db, "letters", atual.id)); b.delete(doc(db, "letterBodies", atual.id));
    await b.commit(); limpar(); aviso("Carta apagada.", "ok");
  } catch (e) { aviso(msgErro(e), "erro"); }
});
$("nova").addEventListener("click", limpar);

const MODELOS = [
  ["Open when you’re sad", "Para quando o dia pesa"], ["Open when you miss me", "Para quando a saudade aperta"],
  ["Open when you need a smile", "Para ganhares um sorriso"], ["Open when you can’t sleep", "Para as noites sem sono"],
  ["Open when you need motivation", "Para quando precisas de força"],
];
$("modelos").addEventListener("click", async () => {
  if (!confirm("Criar 5 rascunhos com estes títulos? Depois escreves o texto de cada um.")) return;
  try {
    const b = writeBatch(db), base = letters.reduce((m, l) => Math.max(m, l.order), 0);
    MODELOS.forEach(([title, condition], i) => {
      const r = doc(col);
      b.set(r, { title, condition, order: base + i + 1, published: false, unlockAt: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      b.set(doc(db, "letterBodies", r.id), { body: "", updatedAt: serverTimestamp() });
    });
    await b.commit(); aviso("Rascunhos criados. Escolhe um na lista para escrever a carta.", "ok");
  } catch (e) { aviso(msgErro(e), "erro"); }
});

onSnapshot(col, (snap) => {
  letters = snap.docs.map((d) => { const x = d.data(); return { id: d.id, title: x.title || "", condition: x.condition || "",
    order: +x.order || 0, published: !!x.published, unlockAt: x.unlockAt ? x.unlockAt.toMillis() : 0, createdAt: x.createdAt || null }; })
    .sort((a, b) => a.order - b.order);
  lista();
}, (e) => aviso(msgErro(e), "erro"));
limpar();
