// Configuração do Firebase (projeto amina-9d61d).
// Estes valores são públicos por desenho: quem protege os dados são as regras do Firestore (firestore.rules).
// Nunca coloques palavras-passe neste ficheiro.
export const firebaseConfig = {
  apiKey: "AIzaSyApYGOIlaVmn7kHTRb-XNCyaFheoZI5Q5c",
  authDomain: "amina-9d61d.firebaseapp.com",
  projectId: "amina-9d61d",
  storageBucket: "amina-9d61d.firebasestorage.app",
  messagingSenderId: "603221891283",
  appId: "1:603221891283:web:b2b9fac23ab157c7fa1c26",
};

// Utilizadores autorizados (as regras do Firestore usam os mesmos UIDs).
export const UIDS = {
  amina: "7T0hiCRudwVQjjoqcRAOduVx9v32",
  halley: "fA7hvZfvqOYfJ1yRS54uSgeBE6t2",
};
export const NOMES = { [UIDS.amina]: "Amina", [UIDS.halley]: "Halley" };
export const CHAT_ID = "amina-halley";
