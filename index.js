import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";

import {
  getDatabase,
  set,
  get,
  ref,
  remove,
  child,
  update,
  push,
  onValue,
  query,
  onChildAdded,
  off,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

import {
  getMessaging,
  getToken,
  onMessage,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging.js";

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

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const database = getDatabase();
const onValueRef = query(ref(database, "groups/"));
const provider = new GoogleAuthProvider();
const auth = getAuth(app);

//script codes
const dbref = ref(database);
let isDateShowed = null;
let userInfo = JSON.parse(localStorage.getItem("userInfo"));
let deviceToken;

onMessage(messaging, (payload) => {
  console.log("Message received. ", payload);
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("firebase-messaging-sw.js")
    .then(function (registration) {
      console.log(
        "ServiceWorker registration successful with scope: ",
        registration.scope
      );
    })
    .catch(function (err) {
      //registration failed :(
      console.log("ServiceWorker registration failed: ", err);
    });
} else {
  console.log("No service-worker on this browser");
}

getToken(messaging, {
  vapidKey:
    "BIa5bs_CC9ONfc05out79umbxXaqJuN1jS3t4gZ7KorIGHjUecGRmvj2pviwsyADk4bDd288q6lF4NyHnK1A-6k",
})
  .then((currentToken) => {
    if (currentToken) {
      deviceToken = currentToken;
      console.log(deviceToken);
      get(child(dbref, "users/" + userInfo.userName)).then((snapshot) => {
        if (snapshot.exists()) {
          set(ref(database, "users/" + userInfo.userName), {
            userName: userInfo.userName,
            email: userInfo.email,
            profilePicture: userInfo.profilePicture,
            deviceToken: deviceToken,
          });
        } else {
          set(ref(database, "users/" + userInfo.userName), {
            userName: userInfo.userName,
            email: userInfo.email,
            profilePicture: userInfo.profilePicture,
            deviceToken: deviceToken,
          });
        }
      });
    } else {
      console.log(
        "No registration token available. Request permission to generate one."
      );
    }
  })
  .catch((err) => {
    console.log("An error occurred while retrieving token. ", err);
  });

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("displayUserName").innerHTML = user.displayName;
    document
      .getElementById("profilePicture")
      .setAttribute("src", user.photoURL);
    document.getElementById("userNameHead").style.display = "none";
    document.getElementById("profile").style.display = "block";
    document.getElementById("groupsAndChats").style.display = "block";
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Permission Granted");
      }
    });

    get(child(dbref, "users/" + user.displayName)).then((snapshot) => {
      let obj = {
        userName: user.displayName,
        email: user.email,
        profilePicture: user.photoURL,
      };
      localStorage.setItem("userInfo", JSON.stringify(obj));
      let data = snapshot.val();
      if (snapshot.exists()) {
        document.getElementById("userNameHead").style.display = "none";
        document.getElementById("profile").style.display = "block";
        document.getElementById("groupsAndChats").style.display = "block";
      } else {
        set(ref(database, "users/" + user.displayName), {
          userName: user.displayName,
          email: user.email,
          profilePicture: user.photoURL,
        });
      }
    });
  } else {
    document.getElementById("groupsAndChats").style.display = "none";
    document.getElementById("userNameHead").style.display = "block";
  }
});

const userSignedIn = async () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      console.log(user);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    });
};

document
  .getElementById("googleLoginBtn")
  .addEventListener("click", userSignedIn);

let click = document.getElementById("inputForMessage");
click.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("messageBtn").click();
  }
});

let click2 = document.getElementById("inputForGroupName");
click2.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("groupBtn").click();
  }
});

let click3 = document.getElementById("inputToChangeUserName");
click2.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("changeUserNameBtn").click();
  }
});

document.getElementById("groupAdder").style.display = "none";
document.getElementById("groupAdderBtn").addEventListener("click", () => {
  document.getElementById("groupAddBtn").style.display = "none";
  document.getElementById("groupAdder").style.display = "block";
  document.getElementById("groupsList").style.display = "none";
  document.getElementById("inputForGroupName").focus();
});

document.getElementById("groupCancel").addEventListener("click", () => {
  document.getElementById("groupAddBtn").style.display = "block";
  document.getElementById("groupAdder").style.display = "none";
  document.getElementById("groupsList").style.display = "block";
});

if (userInfo !== null) {
  get(child(dbref, "users/" + userInfo.userName)).then((snapshot) => {
    let data = snapshot.val();
    if (snapshot.exists()) {
      document.getElementById("userNameHead").style.display = "none";
      document.getElementById("profile").style.display = "block";
      document.getElementById("groupsAndChats").style.display = "block";
    }
  });
} else {
  document.getElementById("userNameHead").style.display = "block";
}

const userSignedOut = async () => {
  signOut(auth)
    .then(() => {
      document.getElementById("profileClose").click();
      document.getElementById("userNameHead").style.display = "block";
      document.getElementById("profile").style.display = "none";
      document.getElementById("groupsAndChats").style.display = "none";
      userInfo = null;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    })
    .catch((error) => {});
};

document.getElementById("changeUser").addEventListener("click", userSignedOut);

document.getElementById("groupBtn").addEventListener("click", function () {
  if (document.getElementById("inputForGroupName").value === "") {
    alert("Please Enter Group Name.");
  } else {
    let id = Math.floor(Math.random() * 9999);
    set(ref(database, "groups/" + id + "/"), {
      groupName: document.getElementById("inputForGroupName").value,
      id: id,
      dateDisplayed: false,
    });
    console.log("Group Entered Successfully");
    document.getElementById("inputForGroupName").value = "";
  }
  document.getElementById("groupAdder").style.display = "none";
  document.getElementById("groupAddBtn").style.display = "block";
  document.getElementById("groupsList").style.display = "block";
});

onChildAdded(
  onValueRef,
  (snapshot) => {
    let data = snapshot.val();
    let group = data.groupName;
    let groupName = document.createElement("button");
    groupName.setAttribute("type", "button");
    groupName.setAttribute("id", data.id);
    groupName.addEventListener("click", () => {
      messages(data.id);
      document.getElementById("inputForMessage").focus();
    });
    groupName.setAttribute("class", "groups");
    groupName.innerHTML = group;
    document.getElementById("groupsList").appendChild(groupName);
    document.getElementById("inputForMessage").focus();
  },
  (errorObject) => {
    console.log("The read failed: " + errorObject.name);
  }
);

let selectedgroup = null;
let oldSelectedgroup;
let onvalref = null;
let dateDisplayed = false;
let todayDate = new Date().toDateString();
function messages(id) {
  let onvalref = query(ref(database, "groups/" + id + "/chats/"));
  if (onvalref) {
    off(onvalref);
  }
  let groupName = document.getElementById(id).innerHTML;
  document.getElementById("chatArea").innerHTML = "";
  document.getElementById("groupNameInChat").innerHTML = "In" + " " + groupName;
  oldSelectedgroup = selectedgroup;
  selectedgroup = id;
  document.getElementById(oldSelectedgroup).classList.remove("selectedgroup");
  document.getElementById(selectedgroup).classList.add("selectedgroup");
  let lastDisplayedDateRef = ref(
    database,
    "groups/" + id + "/lastDisplayedDate"
  );
  let dateDisplayedref = ref(database, "groups/" + id + "/dateDisplayed");
  get(lastDisplayedDateRef).then((snapshot) => {
    let lastDisplayedDate = snapshot.val();
    onChildAdded(onvalref, (snapshot) => {
      let userInfo = JSON.parse(localStorage.getItem("userInfo"));
      let data = snapshot.val();
      let chat = document.createElement("li");
      let message = document.createElement("div");
      let inChatName = document.createElement("p");
      let chats = document.createElement("p");
      let chatTime = document.createElement("p");
      let profilePicture = document.createElement("img");
      profilePicture.setAttribute("src", data.photoURL);
      profilePicture.classList.add("inChatPFP");
      chatTime.classList.add("time");
      chats.classList.add("text");
      inChatName.classList.add("inChatName");
      if (userInfo.userName === data.userName) {
        message.classList.add("chatsGet");
        chat.setAttribute("style", "text-align:right;");
        profilePicture.setAttribute("style", "float:right;");
      } else {
        message.classList.add("chatsSend");
        chat.setAttribute("style", "text-align:left;");
        profilePicture.setAttribute("style", "float:left;");
      }
      let name = document.createTextNode(data.userName);
      inChatName.appendChild(name);
      let text = document.createTextNode(data.message);
      chats.appendChild(text);
      let time = document.createTextNode(data.hour + ":" + data.minute);
      chatTime.appendChild(time);
      document.getElementById("chatArea").appendChild(profilePicture);
      message.appendChild(inChatName);
      message.appendChild(chats);
      message.appendChild(chatTime);
      chat.scrollIntoView({ behavior: "smooth" });
      chat.appendChild(profilePicture);
      chat.appendChild(message);
      let currentDate = data.date;
      if (lastDisplayedDate !== currentDate) {
        let date = document.createElement("p");
        date.classList.add("date");
        let dateText = document.createTextNode(currentDate);
        date.appendChild(dateText);
        document.getElementById("chatArea").appendChild(date);
        lastDisplayedDate = currentDate;
        set(lastDisplayedDateRef, currentDate);
        console.log("in last displayed date");
        dateDisplayed = true;
      } else if (lastDisplayedDate === currentDate) {
        get(dateDisplayedref).then((snapshot) => {
          let dateDisplayed = snapshot.val();
          if (dateDisplayed === false) {
            let date = document.createElement("p");
            date.classList.add("date");
            let dateText = document.createTextNode(currentDate);
            date.appendChild(dateText);
            document.getElementById("chatArea").appendChild(date);
            lastDisplayedDate = currentDate;
            let True = true;
            set(dateDisplayedref, True);
          }
        });
      }
      document.getElementById("chatArea").appendChild(chat);
      let lastChat = document.getElementById("chatArea").lastChild;
      lastChat.scrollIntoView();
    }),
      (document.getElementById("selectGroup").style.display = "none");
  });
  document.getElementById("inputForMessage").focus();
  document.getElementById("chatsAfterGroupSelect").style.display = "block";
  document.getElementById("chatArea").scrollTop =
    document.getElementById("chatArea").scrollHeight;
  document.body.style.zoom = "100%";
}

document.getElementById("groupsList").addEventListener("click", (event) => {
  if (event.target.classList.contains("groups")) {
    let groupId = event.target.id;
    messages(groupId);
  }
});

document.getElementById("messageBtn").addEventListener("click", function (id) {
  let message = document.getElementById("inputForMessage").value;
  let userInfo = JSON.parse(localStorage.getItem("userInfo"));
  let userName = userInfo.userName;
  let profilePicture = userInfo.profilePicture;
  let time = new Date();
  let hour = time.getHours();
  if (hour < 10) {
    hour = "0" + hour;
  }
  let minute = time.getMinutes();
  if (minute < 10) {
    minute = "0" + minute;
  }
  let day = time.getDate();
  let month = time.getMonth() + 1;
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  let year = time.getFullYear();
  let date = day + "/" + month + "/" + year;
  time.getMinutes();
  if (message !== "") {
    let NotificationOptions={
        body:message,
        icon:"massage.png",
    }
    new Notification(userName, NotificationOptions);
    push(ref(database, "groups/" + selectedgroup + "/chats/"), {
      message: message,
      userName: userName,
      hour: hour,
      minute: minute,
      date: date,
      photoURL: profilePicture,
      isDateShowed: date,
    });
    console.log("message Entered Successfully");
    document.getElementById("inputForMessage").value = "";
    document.getElementById("inputForMessage").focus();
  }
});

document.getElementById("profileBtn").addEventListener("click", function () {
  document.getElementById("changeUser").style.display = "block";
  document.getElementById("profileClose").style.display = "block";
  document.getElementById("groupsAndChats").style.display = "none";
});

document.getElementById("profileClose").addEventListener("click", function () {
  document.getElementById("changeUser").style.display = "none";
  document.getElementById("profileClose").style.display = "none";
  document.getElementById("groupsAndChats").style.display = "block";
});