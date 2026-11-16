// Chat privado em tempo real (Cloud Firestore). Coleção: chats/amina-halley/messages
import { exigirLogin, db, NOMES, CHAT_ID, outroUid, terminarSessao, msgErro } from "./firebase.js";
import {
  collection, query, orderBy, limit, startAfter, onSnapshot, getDocs, addDoc, deleteDoc, doc,
  serverTimestamp, writeBatch, arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const PAGE = 50, MAX = 2000;
const user = await exigirLogin();
const me = user.uid, outro = outroUid(user);
$("sub").textContent = "com " + NOMES[outro];

const col = collection(db, "chats", CHAT_ID, "messages");
const all = new Map();          // id -> mensagem
let oldestDoc = null, hasMore = false, firstLoad = true, aMarcar = new Set();

const msgs = $("msgs"), estado = $("estado");
const toMsg = (d) => {
  const x = d.data({ serverTimestamps: "estimate" });
  return { id: d.id, text: String(x.text || ""), uid: x.senderUid, t: x.createdAt ? x.createdAt.toMillis() : Date.now(),
    readBy: Array.isArray(x.readBy) ? x.readBy : [], pend: d.metadata.hasPendingWrites };
};
const hora = (t) => new Date(t).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
function dia(t) {
  const d = new Date(t), h = new Date(), ds = (x) => x.toDateString();
  if (ds(d) === ds(h)) return "Hoje";
  if (ds(d) === ds(new Date(h - 864e5))) return "Ontem";
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: d.getFullYear() !== h.getFullYear() ? "numeric" : undefined });
}
function aviso(t) {
  const a = $("aviso"); a.textContent = t || ""; a.hidden = !t;
  if (t) setTimeout(() => { if (a.textContent === t) a.hidden = true; }, 5000);
}

function render({ keep = null } = {}) {
  const perto = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 120;
  const alturaAntes = msgs.scrollHeight;
  msgs.innerHTML = "";
  const lista = [...all.values()].sort((a, b) => a.t - b.t);
  if (hasMore) {
    const b = document.createElement("button");
    b.className = "btn ghost mais"; b.type = "button"; b.textContent = "Carregar mensagens anteriores";
    b.addEventListener("click", carregarMais);
    msgs.appendChild(b);
  }
  if (!lista.length) {
    estado.hidden = false; estado.className = "estado"; estado.textContent = "Ainda não há mensagens. Diz olá!"; msgs.appendChild(estado);
  }
  let ultimoDia = "";
  for (const m of lista) {
    const d = dia(m.t);
    if (d !== ultimoDia) { ultimoDia = d; const s = document.createElement("div"); s.className = "dia"; s.textContent = d; msgs.appendChild(s); }
    const eu = m.uid === me;
    const b = document.createElement("div");
    b.className = "bolha" + (eu ? " eu" : "");
    b.title = (NOMES[m.uid] || "") + " · " + hora(m.t);
    const txt = document.createElement("div"); txt.textContent = m.text;
    const meta = document.createElement("div"); meta.className = "meta";
    if (!eu) { const n = document.createElement("span"); n.textContent = NOMES[m.uid] || ""; meta.appendChild(n); }
    const h = document.createElement("span"); h.textContent = hora(m.t); meta.appendChild(h);
    if (eu) {
      const k = document.createElement("span"); k.className = "ticks";
      if (m.pend) { k.textContent = "a enviar…"; }
      else if (m.readBy.includes(outro)) { k.textContent = "✓✓"; k.classList.add("lida"); k.title = "Lida"; }
      else { k.textContent = "✓"; k.title = "Enviada"; }
      meta.appendChild(k);
      if (!m.pend) {
        const ap = document.createElement("button");
        ap.type = "button"; ap.className = "apagar"; ap.textContent = "Apagar";
        ap.addEventListener("click", (ev) => { ev.stopPropagation(); apagar(m.id); });
        meta.appendChild(ap);
      }
      b.addEventListener("click", () => b.classList.toggle("sel"));
    }
    b.append(txt, meta); msgs.appendChild(b);
  }
  if (keep !== null) msgs.scrollTop = msgs.scrollHeight - alturaAntes + keep;
  else if (perto || firstLoad) msgs.scrollTop = msgs.scrollHeight;
}

async function apagar(id) {
  if (!confirm("Apagar esta mensagem para ambos?")) return;
  try { await deleteDoc(doc(col, id)); } catch (e) { aviso(msgErro(e)); }
}

function marcarLidas() {
  if (document.visibilityState !== "visible") return;
  const por = [...all.values()].filter((m) => m.uid === outro && !m.readBy.includes(me) && !m.pend && !aMarcar.has(m.id));
  if (!por.length) return;
  const batch = writeBatch(db);
  por.slice(0, 400).forEach((m) => { aMarcar.add(m.id); batch.update(doc(col, m.id), { readBy: arrayUnion(me) }); });
  batch.commit().catch((e) => { por.forEach((m) => aMarcar.delete(m.id)); aviso(msgErro(e)); });
}

// Mensagens mais recentes em tempo real. Mensagens que saem da janela de 50 continuam visíveis.
onSnapshot(query(col, orderBy("createdAt", "desc"), limit(PAGE)), { includeMetadataChanges: true }, (snap) => {
  const ultimo = snap.docs[snap.docs.length - 1];
  const limiar = ultimo ? ultimo.data({ serverTimestamps: "estimate" }).createdAt?.toMillis?.() ?? 0 : 0;
  snap.docChanges({ includeMetadataChanges: true }).forEach((c) => {
    if (c.type === "removed") {
      const t = c.doc.data({ serverTimestamps: "estimate" }).createdAt?.toMillis?.() ?? Date.now();
      if (snap.size < PAGE || t >= limiar) all.delete(c.doc.id);
    } else all.set(c.doc.id, toMsg(c.doc));
  });
  if (firstLoad) { oldestDoc = ultimo || null; hasMore = snap.size === PAGE; }
  estado.hidden = true;
  render(); firstLoad = false; marcarLidas();
}, (e) => {
  estado.hidden = false; estado.className = "estado erro";
  estado.textContent = msgErro(e); msgs.innerHTML = ""; msgs.appendChild(estado);
});

async function carregarMais() {
  if (!oldestDoc) return;
  try {
    const snap = await getDocs(query(col, orderBy("createdAt", "desc"), startAfter(oldestDoc), limit(PAGE)));
    snap.docs.forEach((d) => { if (!all.has(d.id)) all.set(d.id, toMsg(d)); });
    if (snap.docs.length) oldestDoc = snap.docs[snap.docs.length - 1];
    hasMore = snap.size === PAGE;
    render({ keep: msgs.scrollTop });
  } catch (e) { aviso(msgErro(e)); }
}

// Enviar
const txt = $("txt");
function ajustar() { txt.style.height = "auto"; txt.style.height = Math.min(txt.scrollHeight, 140) + "px"; }
txt.addEventListener("input", ajustar);
txt.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && matchMedia("(pointer:fine)").matches) { e.preventDefault(); $("form").requestSubmit(); }
});
$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = txt.value.trim();
  if (!text) return;
  if (text.length > MAX) { aviso("A mensagem é demasiado longa (máx. " + MAX + " caracteres)."); return; }
  txt.value = ""; ajustar(); txt.focus();
  addDoc(col, { text, senderUid: me, createdAt: serverTimestamp(), readBy: [me] })
    .catch((err) => { aviso("Não foi enviada: " + msgErro(err)); if (!txt.value) { txt.value = text; ajustar(); } });
});

$("sair").addEventListener("click", async () => { await terminarSessao(); location.replace("index.html"); });
document.addEventListener("visibilitychange", marcarLidas);
addEventListener("focus", marcarLidas);

// iPhone: ajusta a altura quando o teclado abre
const vv = window.visualViewport;
function vh() { document.documentElement.style.setProperty("--vh", (vv ? vv.height : innerHeight) * 0.01 + "px"); msgs.scrollTop = msgs.scrollHeight; }
if (vv) { vv.addEventListener("resize", vh); } addEventListener("resize", vh); vh();
