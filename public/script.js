const socket = io();
const loginForm = document.getElementById("login-form");
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const themeToggle = document.getElementById("theme-toggle");
const goblinOverlay = document.getElementById("goblin-overlay");
const onlineUsers = document.getElementById("online-users");
const fileInput = document.getElementById("file-input");
const fileButton = document.getElementById("file-button");

let username = "";
let goblinMode = false;
let flyingGoblins = [];
let flashingLights = [];

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  username = document.getElementById("username").value.trim();
  if (username) {
    socket.emit("user joined", username);
    loginContainer.style.display = "none";
    chatContainer.style.display = "flex";
    addMessage(`Welcome, ${username}! You've joined the chat.`);
  }
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (chatInput.value) {
    socket.emit("chat message", { username, message: chatInput.value });
    chatInput.value = "";
  }
});

fileButton.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      socket.emit("chat message", {
        username,
        message: `Sent a file: ${file.name}`,
        file: event.target.result,
      });
    };
    reader.readAsDataURL(file);
  }
});

socket.on("chat message", (data) => {
  if (data.file) {
    addMessage(`${data.username}: ${data.message}`, data.file);
  } else {
    addMessage(`${data.username}: ${data.message}`);
  }
});

socket.on("user joined", (username) => {
  addMessage(`${username} has joined the chat.`);
});

socket.on("user left", (username) => {
  addMessage(`${username} has left the chat.`);
});

socket.on("update users", (users) => {
  updateOnlineUsers(users);
});

themeToggle.addEventListener("click", () => {
  goblinMode = !goblinMode;
  document.body.classList.toggle("goblin-mode");
  themeToggle.textContent = goblinMode ? "Normal Mode" : "Goblin Mode";
  if (goblinMode) {
    playGoblinSound();
    startFlyingGoblins();
    startFlashingLights();
  } else {
    stopFlyingGoblins();
    stopFlashingLights();
  }
});

function addMessage(text, file = null) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.textContent = `> ${text}`;

  if (file) {
    const fileExtension = file.split(";")[0].split("/")[1];
    if (["jpeg", "jpg", "png", "gif"].includes(fileExtension)) {
      const img = document.createElement("img");
      img.src = file;
      messageElement.appendChild(img);
    } else {
      const link = document.createElement("a");
      link.href = file;
      link.textContent = "Download File";
      link.download = "file." + fileExtension;
      messageElement.appendChild(link);
    }
  }

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateOnlineUsers(users) {
  onlineUsers.innerHTML = "<h3>Online Users</h3>";
  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.textContent = user;
    onlineUsers.appendChild(userElement);
  });
}

function typeEffect(element, text, index = 0) {
  if (index < text.length) {
    element.textContent += text[index];
    setTimeout(() => typeEffect(element, text, index + 1), 50);
  }
}

function playGoblinSound() {
  const audio = new Audio(
    "https://www.soundjay.com/human/sounds/man-scream-01.mp3",
  );
  audio.play();
}

function startFlyingGoblins() {
  for (let i = 0; i < 5; i++) {
    const goblin = document.createElement("div");
    goblin.classList.add("flying-goblin");
    goblin.style.top = `${Math.random() * 100}%`;
    goblin.style.left = `${Math.random() * 100}%`;
    goblinOverlay.appendChild(goblin);
    flyingGoblins.push(goblin);
  }
}

function stopFlyingGoblins() {
  flyingGoblins.forEach((goblin) => goblin.remove());
  flyingGoblins = [];
}

function startFlashingLights() {
  for (let i = 0; i < 20; i++) {
    const light = document.createElement("div");
    light.classList.add("flashing-light");
    light.style.top = `${Math.random() * 100}%`;
    light.style.left = `${Math.random() * 100}%`;
    goblinOverlay.appendChild(light);
    flashingLights.push(light);
  }
}

function stopFlashingLights() {
  flashingLights.forEach((light) => light.remove());
  flashingLights = [];
}

// Welcome message
const welcomeMessage = document.createElement("div");
welcomeMessage.classList.add("message");
chatMessages.appendChild(welcomeMessage);
typeEffect(
  welcomeMessage,
  "> Welcome to Thermes hackermans! Please login to start chatting with your friends.",
);

// Easter egg: Konami code for instant Goblin Mode
let konamiCode = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
let konamiIndex = 0;

document.addEventListener("keydown", (e) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      goblinMode = true;
      document.body.classList.add("goblin-mode");
      themeToggle.textContent = "Normal Mode";
      playGoblinSound();
      startFlyingGoblins();
      startFlashingLights();
      addMessage("GOBLIN MODE ACTIVATED!");
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});
