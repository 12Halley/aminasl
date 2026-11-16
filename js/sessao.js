// Mostra "Entrar" ou "Sair" na página inicial. Carrega o Firebase só depois de a página estar pronta.
const el = document.getElementById("sessao");
if (el) {
  import("./firebase.js").then(({ aoMudarSessao, autorizado, terminarSessao, NOMES }) => {
    aoMudarSessao((u) => {
      el.innerHTML = "";
      if (u && autorizado(u)) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "btn ghost"; b.textContent = "Sair (" + NOMES[u.uid] + ")";
        b.addEventListener("click", () => terminarSessao());
        el.appendChild(b);
      } else {
        const a = document.createElement("a");
        a.className = "btn ghost"; a.href = "login.html"; a.textContent = "Entrar";
        el.appendChild(a);
      }
    });
  }).catch(() => { el.hidden = true; });
}
