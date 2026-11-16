// Ponto único de ligação ao Firebase (SDK modular a partir do CDN oficial, versão fixa).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, setPersistence, browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, UIDS, NOMES, CHAT_ID } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Deteção automática de long-polling: mais fiável no Safari/iPhone e em redes com proxy.
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
export { UIDS, NOMES, CHAT_ID };

setPersistence(auth, browserLocalPersistence).catch(() => {});

export const autorizado = (u) => !!u && (u.uid === UIDS.amina || u.uid === UIDS.halley);
export const ehHalley = (u) => !!u && u.uid === UIDS.halley;
export const outroUid = (u) => (u.uid === UIDS.halley ? UIDS.amina : UIDS.halley);

/** Espera pelo estado inicial da sessão (o Firebase restaura a sessão de forma assíncrona). */
export function utilizadorAtual() {
  return new Promise((res) => { const off = onAuthStateChanged(auth, (u) => { off(); res(u); }); });
}
export function aoMudarSessao(cb) { return onAuthStateChanged(auth, cb); }

/** Protege páginas privadas: sem sessão → login; conta não autorizada → logout. */
export async function exigirLogin({ apenasHalley = false } = {}) {
  const u = await utilizadorAtual();
  const pag = location.pathname.split("/").pop() || "index.html";
  const ir = (q) => location.replace("login.html?" + q + "&next=" + encodeURIComponent(pag));
  if (!u) { ir("a=1"); return new Promise(() => {}); }
  if (!autorizado(u) || (apenasHalley && !ehHalley(u))) {
    if (!autorizado(u)) await signOut(auth);
    ir(!autorizado(u) ? "erro=acesso" : "erro=admin");
    return new Promise(() => {});
  }
  return u;
}

export async function entrarComGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export const entrarComEmail = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const recuperarPalavraPasse = (email) => sendPasswordResetEmail(auth, email);
export const terminarSessao = () => signOut(auth);

export function msgErro(e) {
  const c = (e && e.code) || "";
  const m = {
    "auth/invalid-credential": "Email ou palavra-passe incorretos.",
    "auth/wrong-password": "Email ou palavra-passe incorretos.",
    "auth/user-not-found": "Email ou palavra-passe incorretos.",
    "auth/invalid-email": "O email não é válido.",
    "auth/too-many-requests": "Demasiadas tentativas. Espera uns minutos e tenta de novo.",
    "auth/network-request-failed": "Sem ligação à internet. Verifica a rede e tenta de novo.",
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar.",
    "auth/cancelled-popup-request": "A janela do Google foi fechada antes de terminar.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permite pop-ups ou usa o email.",
    "auth/unauthorized-domain": "Este endereço ainda não está autorizado no Firebase (Authentication › Settings › Authorized domains).",
    "auth/operation-not-allowed": "Este método de login não está ativo no Firebase.",
    "permission-denied": "Sem permissão. Confirma se as regras do Firestore foram publicadas.",
    "unavailable": "Sem ligação ao servidor. Tenta de novo.",
  };
  return m[c] || "Ocorreu um erro (" + (c || "desconhecido") + ").";
}
