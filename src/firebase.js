import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, push, query, onChildAdded, off, update, remove, onValue, orderByChild, equalTo, onDisconnect } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInAnonymously, updateProfile } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB-r_eRpmJCAhjcwZiSKUy2QZlegPUCdNE",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chat-application-8e9ce.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://chat-application-8e9ce-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chat-application-8e9ce",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chat-application-8e9ce.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "356463502797",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:356463502797:web:642f8a38037347dafdd084",
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
    remove,
    onValue,
    orderByChild,
    equalTo,
    onDisconnect,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    signInAnonymously,
    updateProfile
};

