if ("function" == typeof importScripts) {
  importScripts(
    "https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js"
  );
  importScripts(
    "https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js"
  );

  const firebaseConfig = {
    apiKey: "AIzaSyB-r_eRpmJCAhjcwZiSKUy2QZlegPUCdNE",
    authDomain: "chat-application-8e9ce.firebaseapp.com",
    databaseURL: "https://chat-application-8e9ce-default-rtdb.firebaseio.com",
    projectId: "chat-application-8e9ce",
    storageBucket: "chat-application-8e9ce.appspot.com",
    messagingSenderId: "356463502797",
    appId: "1:356463502797:web:642f8a38037347dafdd084",
  };

  // Initialize Firebase

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((data) => {
    console.log("background notif: ", data);
  });
}
