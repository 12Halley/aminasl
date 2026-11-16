import { utilizadorAtual, autorizado, entrarComGoogle, entrarComEmail, recuperarPalavraPasse, terminarSessao, msgErro } from "./firebase.js";
const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const seguro = (n) => (/^[a-z0-9-]+\.html$/i.test(n || "") ? n : "chat.html");
const destino = seguro(q.get("next"));

function aviso(t, tipo) { const e = $("aviso"); e.textContent = t || ""; e.dataset.tipo = tipo || ""; e.hidden = !t; }
function ocupado(on) { document.querySelectorAll("#login button, #login input").forEach((x) => { x.disabled = on; }); }

if (q.get("erro") === "acesso") aviso("Esta conta não tem acesso a esta área.", "erro");
if (q.get("erro") === "admin") aviso("Esta página é só para o Halley.", "erro");

async function aposLogin(u) {
  if (!autorizado(u)) {
    await terminarSessao();
    aviso("Esta conta não tem acesso a esta área.", "erro"); ocupado(false); return;
  }
  location.replace(destino);
}
utilizadorAtual().then((u) => { if (u && autorizado(u)) location.replace(destino); });

$("google").addEventListener("click", async () => {
  aviso(""); ocupado(true);
  try { await aposLogin((await entrarComGoogle()).user); }
  catch (e) { aviso(msgErro(e), "erro"); ocupado(false); }
});
$("login").addEventListener("submit", async (ev) => {
  ev.preventDefault(); aviso(""); ocupado(true);
  try { await aposLogin((await entrarComEmail($("email").value.trim(), $("pass").value)).user); }
  catch (e) { aviso(msgErro(e), "erro"); ocupado(false); }
});
$("esqueci").addEventListener("click", async () => {
  const email = $("email").value.trim();
  if (!email) { aviso("Escreve primeiro o teu email e toca outra vez em «Esqueci-me da palavra-passe».", "erro"); $("email").focus(); return; }
  ocupado(true);
  try { await recuperarPalavraPasse(email); aviso("Se o email estiver registado, vais receber uma ligação para criar uma nova palavra-passe.", "ok"); }
  catch (e) { aviso(msgErro(e), "erro"); }
  ocupado(false);
});
