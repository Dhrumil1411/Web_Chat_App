import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    get,
    child,
    push,
    query,
    onChildAdded,
    off,
    update,
    onValue,
    orderByChild,
    equalTo,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB-r_eRpmJCAhjcwZiSKUy2QZlegPUCdNE",
    authDomain: "chat-application-8e9ce.firebaseapp.com",
    databaseURL: "https://chat-application-8e9ce-default-rtdb.firebaseio.com",
    projectId: "chat-application-8e9ce",
    storageBucket: "chat-application-8e9ce.appspot.com",
    messagingSenderId: "356463502797",
    appId: "1:356463502797:web:642f8a38037347dafdd084",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {
    app,
    database,
    auth,
    provider,
    ref,
    set,
    get,
    child,
    push,
    query,
    onChildAdded,
    off,
    update,
    onValue,
    orderByChild,
    equalTo,
    onDisconnect,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
};
