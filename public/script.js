// =============================
// Firebase Initialization
// =============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildRemoved,
  off,
  remove,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBA4wgeCfei3n2JF6h2tgGYCs0SKt7rFWQ",
  authDomain: "chat-application-68a84.firebaseapp.com",
  databaseURL: "https://chat-application-68a84-default-rtdb.firebaseio.com",
  projectId: "chat-application-68a84",
  storageBucket: "chat-application-68a84.firebasestorage.app",
  messagingSenderId: "261302944857",
  appId: "1:261302944857:web:7da5911ab0c5a70fed5d48",
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// =============================
// Google Authentication
// =============================

const googleProvider = new GoogleAuthProvider();

// User sign-in using Google authentication
document.getElementById("sign-in").addEventListener("click", () => {
  signInWithPopup(auth, googleProvider)
    .then(() => console.log("Login successful"))
    .catch((error) => alert(error.message));
});

// User sign-out function
document.getElementById("sign-out").addEventListener("click", () => {
  signOut(auth)
    .then(() => alert("Signed out successfully."))
    .catch((error) => alert(error.message));
});

// =============================
// Theme Change Functionality
// =============================

document.getElementById("theme-btn").addEventListener("click", () => {
  const body = document.querySelector("body");
  const chatSection = document.querySelector(".right");

  body.classList.toggle("light");
  chatSection.classList.toggle("light");

  if (
    body.classList.contains("light") &&
    chatSection.classList.contains("light")
  ) {
    body.style.backgroundColor = "#f4f4f4";
    chatSection.style.backgroundColor = "#fdced6";
  } else {
    body.style.backgroundColor = "#292929";
    chatSection.style.backgroundColor = "#000";
  }
});

// =============================
// Chat Room Functionality
// =============================

let currentRoom = "general";
let currentRoomRef = ref(db, `chatRooms/${currentRoom}`);

// --------------------
// Room Selection
// --------------------

const rooms = document.querySelector("#rooms");

rooms.addEventListener("change", () => {
  currentRoom = rooms.value;
  currentRoomRef = ref(db, `chatRooms/${currentRoom}`);
  loadChat();
});

// --------------------
// Create New Room
// --------------------

const newRoom = document.querySelector("#new-room");
const newRoomInput = document.querySelector("#new-room-input");

newRoom.addEventListener("click", () => {
  newRoom.classList.toggle("active-btn");
  if (newRoom.textContent === "New room") {
    newRoom.textContent = "Create";
    newRoomInput.style.display = "inline-block";
  } else {
    newRoom.textContent = "New room";

    if (newRoomInput.value.trim()) {
      currentRoom = newRoomInput.value.trim();
      currentRoomRef = ref(db, `chatRooms/${currentRoom}`);

      console.log("New room created:", currentRoom);

      push(ref(db, `chatRooms/${currentRoom}`), {
        key: "notification",
        memberName: auth.currentUser.displayName,
        msg: `<bold>${auth.currentUser.displayName}</bold> created room "${currentRoom}"`,
        timestamp: new Date().toLocaleTimeString(),
      });

      newRoomInput.value = "";
      loadRooms();
    }

    newRoomInput.style.display = "none";
  }
});

// --------------------
// Send Message
// --------------------

document.getElementById("send-btn").addEventListener("click", () => {
  const msgInput = document.querySelector("#user-message");

  if (auth.currentUser && msgInput.value.trim()) {
    push(currentRoomRef, {
      key: "chat",
      memberName: auth.currentUser.displayName,
      msg: msgInput.value,
      timestamp: new Date().toLocaleTimeString(),
    });

    msgInput.value = ""; // Clear input field after sending
  }
});

// --------------------
// Delete All Chats
// --------------------

const deleteMessage = document.querySelector("#delete-chats");

deleteMessage.addEventListener("click", () => {
  if (
    confirm(
      "Warning: Chats will be cleared for all members. Do you want to clear chat?"
    )
  ) {
    set(currentRoomRef, null);

    push(currentRoomRef, {
      key: "notification",
      memberName: auth.currentUser.displayName,
      msg: `<bold>${auth.currentUser.displayName}</bold> cleared all chats`,
      timestamp: new Date().toLocaleTimeString(),
    });

    loadChat();
  }
});

// =============================
// Load and Display Chats
// =============================

// Load available rooms
const loadRooms = () => {
  rooms.innerHTML = "";
  off(ref(db, "chatRooms"));

  onChildAdded(ref(db, "chatRooms"), (snapshot) => {
    const roomOption = document.createElement("option");
    roomOption.setAttribute("value", snapshot.key);
    roomOption.textContent = snapshot.key;

    if (snapshot.key === currentRoom) {
      console.log("Current room selected:", snapshot.key);
      roomOption.setAttribute("selected", "true");
    }

    rooms.append(roomOption);
  });

  loadChat();
};

// Load chat messages for selected room
const chatroom = document.querySelector("#chatroom");

const loadChat = () => {
  chatroom.innerHTML = "";
  off(currentRoomRef);

  onChildAdded(currentRoomRef, (snapshot) => {
    const msgData = snapshot.val();
    const li = document.createElement("li");

    // Check if message is a notification or a user message
    if (msgData.key === "notification") {
      li.classList.add("notification");
    } else if (msgData.memberName === auth.currentUser.displayName) {
      li.classList.add("right-side-msg"); // Current user's messages
    } else {
      li.classList.add("left-side-msg"); // Other users' messages
    }

    // Construct message UI
    li.innerHTML = `
      <div>
        <div class="message-data">
          <span>${msgData.memberName}</span>
          <span>${msgData.timestamp}</span>
        </div>
        <div class="message-content">
          <p>${msgData.msg}</p>
        </div>
      </div>
    `;

    // Append message to chatroom
    chatroom.appendChild(li);
    li.scrollIntoView({ behavior: "smooth", block: "end" });
  });
};

// =============================
// User Authentication State Check
// =============================

(function checkIsUserLogged() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Show UI elements for logged-in users
      window.screen.width > "768px"
        ? (document.querySelector(".left").style.width = "30%")
        : (document.querySelector(".left").style.width =
            "-webkit-fill-available");
      document.querySelector(".left div").style.display = "block";
      document.querySelector(".right").style.display = "block";
      document.querySelector("#sign-out").style.display = "inline-block";
      document.querySelector("#new-room").style.display = "inline-block";
      document.querySelector("#delete-chats").style.display = "inline-block";
      document.querySelector("#sign-in").style.display = "none";

      loadRooms();
    } else {
      // Hide chat UI for logged-out users
      document.querySelector(".left div").style.display = "none";
      document.querySelector(".left").style.width = "-webkit-fill-available";
      document.querySelector("#new-room").style.display = "none";
      document.querySelector(".right").style.display = "none";
      document.querySelector("#sign-out").style.display = "none";
      document.querySelector("#delete-chats").style.display = "none";
      document.querySelector("#sign-in").style.display = "inline-block";

      console.log("Please log in first");
    }
  });
})();
