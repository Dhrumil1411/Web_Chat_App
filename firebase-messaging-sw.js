import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging.js";

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
const messaging = getMessaging(app);

