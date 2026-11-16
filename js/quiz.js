// Quiz Amina — perguntas originais, interface nova.
import { $, h, shuffle, rec, seg } from "./jogos/util.js";

const PERGUNTAS = [

            {obra:"BTS",image:"assets/img/quiz/bts.jpg",q:"Qual é o líder do BTS?",opts:["Jimin","RM","V","Suga"],correct:1},
            {obra:"BTS",image:"assets/img/quiz/bts.jpg",q:"Qual membro do BTS é também ator de K-Drama?",opts:["Jungkook","Jin","V","J-Hope"],correct:2},
            {obra:"BTS",image:"assets/img/quiz/bts.jpg",q:"Como se chama o exército de fãs do BTS?",opts:["ONCE","ARMY","STAY","BLINK"],correct:1},
            {obra:"Laufey",image:"assets/img/quiz/laufey.jpg",q:"De que país é a cantora Laufey?",opts:["Dinamarca","Noruega","Islândia","Suécia"],correct:2},
            {obra:"Laufey",image:"assets/img/quiz/laufey.jpg",q:"Qual instrumento Laufey toca principalmente?",opts:["Guitarra","Piano","Violino","Baixo"],correct:1},
            {obra:"Laufey",image:"assets/img/quiz/laufey.jpg",q:"Qual destes é um álbum de Laufey?",opts:["Bewitched","Enchanted","Lover","Midnights"],correct:0},
            {obra:"Barbie",image:"assets/img/quiz/barbie.jpg",q:"Quem interpretou a Barbie no filme de 2023?",opts:["Zendaya","Margot Robbie","Florence Pugh","Anne Hathaway"],correct:1},
            {obra:"Barbie",image:"assets/img/quiz/barbie.jpg",q:"Quem dirigiu o filme Barbie (2023)?",opts:["Greta Gerwig","Sofia Coppola","Ava DuVernay","Nancy Meyers"],correct:0},
            {obra:"Pokémon",image:"assets/img/quiz/pokemon.jpg",q:"Qual é o Pokémon de número 1 na Pokédex?",opts:["Mewtwo","Bulbasaur","Charmander","Pikachu"],correct:1},
            {obra:"Pokémon",image:"assets/img/quiz/pokemon.jpg",q:"Qual tipo de Pokémon é Pikachu?",opts:["Fogo","Água","Elétrico","Voador"],correct:2},
            {obra:"Pokémon",image:"assets/img/quiz/pokemon.jpg",q:"Qual é o parceiro principal de Ash Ketchum?",opts:["Charizard","Bulbasaur","Pikachu","Eevee"],correct:2},
            {obra:"My Little Pony",image:"assets/img/quiz/mlp.jpg",q:"Qual é o nome da pony protagonista de MLP: FiM?",opts:["Rainbow Dash","Twilight Sparkle","Rarity","Pinkie Pie"],correct:1},
            {obra:"My Little Pony",image:"assets/img/quiz/mlp.jpg",q:"Como se chama a cidade principal de MLP?",opts:["Canterlot","Ponyville","Cloudsdale","Appleloosa"],correct:1},
            {obra:"Conan",image:"assets/img/quiz/conan.jpg",q:"Qual é o nome real de Conan Edogawa?",opts:["Shinichi Kudo","Kaito Kid","Heiji Hattori","Mouri Kogorou"],correct:0},
            {obra:"Conan",image:"assets/img/quiz/conan.jpg",q:"Quem transformou Shinichi em criança?",opts:["A Organização Negra","A Interpol","O FBI","Um cientista louco"],correct:0},
            {obra:"Conan",image:"assets/img/quiz/conan.jpg",q:"Qual é o nome da filha do detetive Mouri?",opts:["Ai Haibara","Ran Mouri","Sonoko Suzuki","Kazuha Toyama"],correct:1},
            {obra:"Romantic Killer",image:"assets/img/quiz/romantic-killer.jpg",q:"Qual é o principal objetivo de Riri no anime?",opts:["Ensinar Anzu a amar","Fazer Anzu abandonar os videogames","Transformar Anzu em heroína","Fazer Anzu se apaixonar"],correct:3},
            {obra:"Romantic Killer",image:"assets/img/quiz/romantic-killer.jpg",q:"Qual o nome do amigo de infância de Anzu?",opts:["Junta","Ryuuji","Takashi","Akira"],correct:0},
            {obra:"Romantic Killer",image:"assets/img/quiz/romantic-killer.jpg",q:"Anzu é obrigada a lidar com quê pela primeira vez?",opts:["Vários pretendentes românticos","Cuidar de animal mágico","Resolver mistérios","Competir em torneios"],correct:0},
            {obra:"Seven Deadly Sins",image:"assets/img/quiz/seven-deadly-sins.jpg",q:"Quem é o capitão dos Sete Pecados Capitais?",opts:["Ban","Meliodas","Escanor","King"],correct:1},
            {obra:"Seven Deadly Sins",image:"assets/img/quiz/seven-deadly-sins.jpg",q:"Qual pecado Meliodas representa?",opts:["Gula","Luxúria","Ira","Preguiça"],correct:2},
            {obra:"Seven Deadly Sins",image:"assets/img/quiz/seven-deadly-sins.jpg",q:"O poder de Escanor varia com o quê?",opts:["Sua emoção","A posição do sol","Sua saúde","A fase da lua"],correct:1},
            {obra:"Spy x Family",image:"assets/img/quiz/spy-x-family.jpg",q:"Qual é o codinome do espião protagonista?",opts:["Twilight","Nightfall","Shadow","Phantom"],correct:0},
            {obra:"Spy x Family",image:"assets/img/quiz/spy-x-family.jpg",q:"Qual a habilidade especial de Anya?",opts:["Telepatia","Invisibilidade","Superforça","Controle mental"],correct:0},
            {obra:"Spy x Family",image:"assets/img/quiz/spy-x-family.jpg",q:"Qual o nome do cachorro da família Forger?",opts:["Max","Bond","Spike","Snow"],correct:1},
            {obra:"Demon Slayer",image:"assets/img/quiz/demon-slayer.jpg",q:"Quem é o protagonista de Demon Slayer?",opts:["Tanjiro Kamado","Inosuke Hashibira","Zenitsu Agatsuma","Rengoku"],correct:0},
            {obra:"Demon Slayer",image:"assets/img/quiz/demon-slayer.jpg",q:"Qual é o nome da irmã de Tanjiro?",opts:["Nezuko Kamado","Kanao Tsuyuri","Shinobu Kocho","Mitsuri"],correct:0},
            {obra:"Demon Slayer",image:"assets/img/quiz/demon-slayer.jpg",q:"Qual é o Hashira conhecido como Pilar da Chama?",opts:["Kyojuro Rengoku","Tengen Uzui","Giyu Tomioka","Muichiro Tokito"],correct:0},
];

const app = $("#app");
let modo = rec.get("quiz.modo", "10"), fila = [], i = 0, certas = 0, erradas = 0, resp = false;

app.innerHTML = `
  <div class="g-row"><div id="modo"></div></div>
  <div id="jogo"></div>`;
seg($("#modo"), [["10", "Rápido (10)"], ["todas", "Completo (" + PERGUNTAS.length + ")"]], modo, (v) => { modo = v; rec.set("quiz.modo", v); comecar(); }, "Número de perguntas");
const jogo = $("#jogo");

function comecar() {
  fila = shuffle(PERGUNTAS); if (modo === "10") fila = fila.slice(0, 10);
  i = 0; certas = 0; erradas = 0; mostrar();
}

function mostrar() {
  const p = fila[i]; resp = false;
  const ops = shuffle(p.opts.map((t, k) => ({ t, ok: k === p.correct })));
  jogo.innerHTML = `
    <div class="g-bar" style="margin-bottom:.8rem">
      <div class="stat"><b>${i + 1}<small style="font-size:.9rem;color:var(--creme-3)"> / ${fila.length}</small></b><span>Pergunta</span></div>
      <div class="grp"><div class="stat"><b>${certas}</b><span>Certas</span></div><div class="stat"><b>${erradas}</b><span>Erradas</span></div></div>
    </div>
    <div class="qz-card">
      <div class="qz-prog" aria-hidden="true"><i style="width:${(i / fila.length) * 100}%"></i></div>
      <div class="qz-img"><img alt="" src="${p.image}"></div>
      <div class="qz-obra"></div>
      <div class="qz-q"></div>
    </div>
    <div class="qz-ops" role="group" aria-label="Respostas" style="margin-top:1rem"></div>
    <p class="qz-fb" aria-live="polite" style="margin-top:.8rem"></p>
    <div class="g-row c"><button class="btn" id="seg" type="button" hidden></button></div>`;
  $(".qz-obra", jogo).textContent = p.obra;
  $(".qz-q", jogo).textContent = p.q;
  const box = $(".qz-ops", jogo);
  ops.forEach((o, k) => {
    const b = h("button", "qz-op"); b.type = "button"; b.textContent = o.t; b.dataset.ok = o.ok ? "1" : "";
    b.addEventListener("click", () => escolher(b, o.ok));
    box.appendChild(b);
  });
}

function escolher(b, ok) {
  if (resp) return; resp = true;
  const fb = $(".qz-fb", jogo);
  $$ops().forEach((x) => { x.disabled = true; if (x.dataset.ok) x.classList.add("certa"); });
  if (ok) { certas++; fb.textContent = "Certo."; }
  else { erradas++; b.classList.add("errada"); fb.textContent = "A resposta certa está destacada."; }
  const s = $("#seg", jogo); s.hidden = false; s.textContent = i + 1 < fila.length ? "Seguinte" : "Ver resultado";
  s.onclick = () => { i++; i < fila.length ? mostrar() : fim(); }; s.focus({ preventScroll: true });
}
const $$ops = () => [...jogo.querySelectorAll(".qz-op")];

function fim() {
  const pct = Math.round((certas / fila.length) * 100);
  let nivel = "Ihh chefe, tás mal assim?";
  if (pct >= 80) nivel = "Yeah chefe, já podes ser uma Otome.";
  else if (pct >= 60) nivel = "Parabéns chefe!";
  else if (pct >= 40) nivel = "Quase lá, chefe.";
  else if (pct >= 20) nivel = "Epha, pelo menos acertaste algumas.";
  const chave = "quiz.rec." + modo, melhor = Math.max(rec.get(chave, 0), pct); rec.set(chave, melhor);
  jogo.innerHTML = `<div class="qz-card qz-fim"><div class="big">${pct}%</div><h2>${nivel}</h2>
    <p class="muted">${certas} certas, ${erradas} erradas. Melhor resultado: ${melhor}%.</p>
    <div class="g-row c" style="margin-top:1.4rem"><button class="btn" id="de-novo" type="button">Jogar outra vez</button></div></div>`;
  $("#de-novo", jogo).addEventListener("click", comecar);
}

addEventListener("keydown", (e) => {
  const n = +e.key; if (!resp && n >= 1 && n <= 4) { const b = $$ops()[n - 1]; if (b) b.click(); }
  else if (resp && (e.key === "Enter" || e.key === " ")) { const s = $("#seg", jogo); if (s && !s.hidden && document.activeElement !== s) { e.preventDefault(); s.click(); } }
});
comecar();
