# Site da Amina

Site estático para GitHub Pages (sem build, sem serviços pagos). Firebase (plano gratuito) é usado só para login, chat e cartas.

## Estrutura
- Páginas: `index`, `pagina2` (jogos), `galeria`, `quiz`, 10 jogos (`petiscos`, `memoria`, `sequencia`, `nonograma`, `caca-palavras`, `quebra-cabeca`, `snake`, `2048`, `forca`, `sudoku`), `login`, `chat`, `cartas`, `admin`
- `css/` estilos, `js/` scripts (`firebase.js`, `chat.js`, `cartas.js`, `admin.js`, `login.js`…), `js/jogos/` um módulo por jogo + `util.js` partilhado (recordes em localStorage, sons, gestos)
- `data/fotos.json` fotografias da galeria · `assets/` imagens e áudio · `firestore.rules` regras de segurança

## 1. Configurar o Firebase (uma vez)
1. **Authentication › Sign-in method:** Google e Email/Password ativos (já feito).
2. **Authentication › Users:** cria as contas por email (Add user) para a Amina e para o Halley, ou entra uma vez com Google. Os UIDs têm de ser estes:
   - Amina `7T0hiCRudwVQjjoqcRAOduVx9v32` · Halley `fA7hvZfvqOYfJ1yRS54uSgeBE6t2`
   (O site não tem página de registo: só contas criadas por ti entram.)
3. **Authentication › Settings › Authorized domains:** adiciona `12halley.github.io`.
4. **Firestore › Rules:** apaga o conteúdo e cola `firestore.rules` → **Publish**. (O ficheiro está pronto, mas só fica ativo depois de o publicares.)
5. Opcional: Google Cloud › Credentials › API key: restringe a `https://12halley.github.io/*`.

## 2. Testar as regras no Rules Playground (Firestore › Rules › Rules playground)
Usa "Simulation type: get" e deixa "Authenticated" ligado, com o UID indicado:
| Caminho | Quem | Esperado |
|---|---|---|
| `chats/amina-halley/messages/x` | Amina ou Halley | Permitido |
| `chats/amina-halley/messages/x` | UID inventado / não autenticado | Negado |
| `chats/outro/messages/x` | Amina | Negado |
| `letterBodies/ID` (carta não publicada) | Amina | Negado |
| `letterBodies/ID` (carta publicada, `unlockAt` no futuro) | Amina | Negado |
| `letterBodies/ID` (publicada, sem data ou data passada) | Amina | Permitido |
| `letters/ID` | Halley | Permitido |
Para os `letterBodies` precisas de criar primeiro uma carta pela página de administração. Escrever (create) não se simula bem no Playground por causa da hora do servidor: testa pelo site (passo 4).

## 3. Publicar no GitHub Pages
1. Substitui o conteúdo do repositório pelos ficheiros desta pasta (mantém a estrutura de pastas) e faz commit/push.
2. Settings › Pages › Deploy from a branch › `main` / root.
3. Abre `https://12halley.github.io/aminafr/` (força atualização: Ctrl+F5, ou no iPhone fecha e reabre o separador).

## 4. Testar login nos dois dispositivos
1. No telemóvel da Amina e no teu computador/telemóvel abre `login.html`.
2. Entra com Google ou email. Deves ser levado ao chat. Fecha o separador e reabre: a sessão deve continuar.
3. Com uma conta que **não** seja das duas (ou sem sessão), abre `chat.html`: deve ser reencaminhado para o login.
4. Testa «Esqueci-me da palavra-passe» (chega um email do Firebase) e o botão de sair (⎋ no chat, «Sair» na página inicial).
> Dentro do navegador do WhatsApp/Instagram o Google bloqueia o login: abre o link no Safari/Chrome ou usa email e palavra-passe.

## 5. Testar o chat em tempo real
1. Dois dispositivos com sessões diferentes em `chat.html`.
2. Envia uma mensagem de um: deve aparecer no outro em 1–2 s, com ✓ (enviada).
3. Quando o outro a vê (página aberta e visível) passa a ✓✓ (lida).
4. Toca numa mensagem tua › «Apagar»: desaparece nos dois. Não consegues apagar as do outro.
5. Desliga a rede, envia (fica «a enviar…»), volta a ligar: é enviada.

## 6. Cartas Open When
- **Halley:** `admin.html` (botão «Gerir cartas» em `cartas.html`). «Criar as 5 cartas-modelo» cria rascunhos com os títulos combinados; escolhe cada um, escreve o texto, define (opcional) data/hora de desbloqueio e marca «Publicada».
- **Amina:** vê só as publicadas. As agendadas aparecem com cadeado e abrem sozinhas à hora (as regras do Firestore recusam o texto antes da hora, mesmo que alguém mude o relógio do telemóvel).

## 7. Adicionar fotografias (sem custos)
1. Copia a imagem para `assets/img/galeria/` (nome sem espaços, até ~1600 px).
2. Acrescenta em `data/fotos.json`: `{"src":"assets/img/galeria/praia.jpg","title":"Dia de praia","album":"Viagens","date":"Março de 2026","w":1200,"h":900}` (`w`/`h` = pixéis). Com 2 ou mais álbuns surgem filtros. A «Memória com fotografias» e o «Quebra-cabeça» usam automaticamente as mesmas fotos.

## 8. Música
Coloca o ficheiro em `assets/audio/musica.mp3`. Sem ficheiro, o botão não aparece.

## Visual
- Tema «noite das lanternas»: `css/base.css` (variáveis de cor e tipografia no topo), `paginas.css` (home, jogos, galeria), `app.css` (chat, cartas, admin), `jogos.css` (todos os jogos e o quiz).
- Tipografia: Bodoni Moda (títulos) e Hanken Grotesk (interface), via Google Fonts.
- Sem emojis: ícones em SVG de traço fino; o céu e as lanternas da home são desenhados em canvas (`js/ui.js`).
- A cada carta já não é usado o campo `emoji` (continua permitido nas regras do Firestore, mas deixa de ser gravado).
