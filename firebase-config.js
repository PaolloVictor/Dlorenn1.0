// Configuração centralizada do Firebase para D.Lorenn

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDT-aNgU1x_KE2ZAGNm0n-ybwSLlhFlWug",
    authDomain: "dlorenn-a46ca.firebaseapp.com",
    projectId: "dlorenn-a46ca",
    storageBucket: "dlorenn-a46ca.firebasestorage.app",
    messagingSenderId: "506404020523",
    appId: "1:506404020523:web:a2f6219e6c70699d95e56e",
    measurementId: "G-ZL75PD9788"
};

// Inicializar Firebase (verificando se já foi inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Referências aos serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Exportar as referências para uso em outros arquivos
// (Não é necessário em scripts incluídos diretamente no HTML, mas mantido para compatibilidade com módulos ES6)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, db, storage };
}