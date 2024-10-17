const socket = io();
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
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
const channelList = document.getElementById("channel-list");
const channelName = document.getElementById("channel-name");
const createChannelForm = document.getElementById("create-channel-form");

let username = "";
let isAdmin = false;
let goblinMode = false;
let flyingGoblins = [];
let flashingLights = [];
let currentChannel = "general";
let typingTimeout;
let userColor = "";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      isAdmin = data.isAdmin;
      loginContainer.style.display = "none";
      chatContainer.style.display = "flex";
      socket.emit("user joined", username);
      addMessage(`Welcome, ${username}! You've joined the chat.`);
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again.");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newUsername = document.getElementById("new-username").value.trim();
  const newPassword = document.getElementById("new-password").value;

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });
    const data = await response.json();
    if (response.ok) {
      alert("Registration successful. Please log in.");
      document.getElementById("username").value = newUsername;
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again.");
  }
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (chatInput.value) {
    socket.emit("chat message", {
      username,
      message: chatInput.value,
      channel: currentChannel,
    });
    chatInput.value = "";
  }
});

createChannelForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newChannel = document.getElementById("new-channel").value.trim();
  if (newChannel && isAdmin) {
    socket.emit("create channel", newChannel);
    document.getElementById("new-channel").value = "";
  }
});

chatInput.addEventListener("input", () => {
  if (chatInput.value) {
    socket.emit("typing", { channel: currentChannel });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stop typing", { channel: currentChannel });
    }, 1000);
  } else {
    socket.emit("stop typing", { channel: currentChannel });
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
        channel: currentChannel,
      });
    };
    reader.readAsDataURL(file);
  }
});

socket.on("chat message", (data) => {
  if (data.channel === currentChannel) {
    if (data.file) {
      addMessage(`${data.username}: ${data.message}`, data.file, data.color);
    } else {
      addMessage(`${data.username}: ${data.message}`, null, data.color);
    }
  } else {
    notifyNewMessage(data.channel);
  }
});

socket.on("reply", (data) => {
  if (data.channel === currentChannel) {
    addReply(data);
  } else {
    notifyNewMessage(data.channel);
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

socket.on("update channels", (channels) => {
  updateChannelList(channels);
});

socket.on("update user channels", (userChannels) => {
  updateChannelList(userChannels);
});

socket.on("set color", (color) => {
  userColor = color;
});

socket.on("typing", (data) => {
  if (data.channel === currentChannel) {
    addTypingIndicator(data.username);
  }
});

socket.on("stop typing", (data) => {
  if (data.channel === currentChannel) {
    removeTypingIndicator(data.username);
  }
});

themeToggle.addEventListener("click", () => {
  goblinMode = !goblinMode;
  document.body.classList.toggle("goblin-mode");
  themeToggle.textContent = goblinMode ? "Normal Mode" : "Goblin Mode";
  if (goblinMode) {
    playGoblinSound();
    startFlyingGoblins();
    startFlashingLights();
    startFlyingCubes();
    startFlyingGorilla();
  } else {
    stopFlyingGoblins();
    stopFlashingLights();
    stopFlyingCubes();
    stopFlyingGorilla();
  }
});

function addMessage(text, file = null, color = "#0f0") {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<span style="color: ${color}">> ${text}</span>`;

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

  const replyButton = document.createElement("button");
  replyButton.textContent = "Reply";
  replyButton.addEventListener("click", () => startReply(text));
  messageElement.appendChild(replyButton);

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addReply(data) {
  const replyElement = document.createElement("div");
  replyElement.classList.add("reply");
  replyElement.innerHTML = `
    <div class="reply-original" style="color: ${data.color}">
      ${data.originalMessage}
    </div>
    <div class="reply-content" style="color: ${data.color}">
      ${data.username}: ${data.message}
    </div>
  `;
  chatMessages.appendChild(replyElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function startReply(originalMessage) {
  chatInput.value = `Replying to: "${originalMessage}"\n`;
  chatInput.focus();
}

function updateOnlineUsers(users) {
  onlineUsers.innerHTML = "<h3>Online Users</h3>";
  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.textContent = user;
    onlineUsers.appendChild(userElement);
  });
}

function updateChannelList(channels) {
  channelList.innerHTML = "<h3>Channels</h3>";
  channels.forEach((channel) => {
    const channelElement = document.createElement("div");
    channelElement.textContent = channel;
    channelElement.classList.add("channel");
    channelElement.addEventListener("click", () => switchChannel(channel));
    channelList.appendChild(channelElement);
  });
}

function switchChannel(channel) {
  currentChannel = channel;
  channelName.textContent = channel;
  chatMessages.innerHTML = "";
  socket.emit("join channel", channel);
  addMessage(`Switched to channel: ${channel}`);
}

function notifyNewMessage(channel) {
  const channelElement = channelList.querySelector(
    `.channel:contains('${channel}')`,
  );
  if (channelElement) {
    channelElement.classList.add("new-message");
  }
}

function addTypingIndicator(username) {
  const typingElement = document.createElement("div");
  typingElement.classList.add("typing-indicator");
  typingElement.textContent = `${username} is typing...`;
  typingElement.id = `typing-${username}`;
  chatMessages.appendChild(typingElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator(username) {
  const typingElement = document.getElementById(`typing-${username}`);
  if (typingElement) {
    typingElement.remove();
  }
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

function startFlyingCubes() {
  for (let i = 0; i < 10; i++) {
    const cube = document.createElement("div");
    cube.classList.add("flying-cube");
    cube.style.top = `${Math.random() * 100}%`;
    cube.style.left = `${Math.random() * 100}%`;
    goblinOverlay.appendChild(cube);
  }
}

function stopFlyingCubes() {
  const cubes = document.querySelectorAll(".flying-cube");
  cubes.forEach((cube) => cube.remove());
}

function startFlyingGorilla() {
  const gorilla = document.createElement("div");
  gorilla.classList.add("flying-gorilla");
  goblinOverlay.appendChild(gorilla);
}

function stopFlyingGorilla() {
  const gorilla = document.querySelector(".flying-gorilla");
  if (gorilla) {
    gorilla.remove();
  }
}

// Welcome message
const welcomeMessage = document.createElement("div");
welcomeMessage.classList.add("message");
chatMessages.appendChild(welcomeMessage);
typeEffect(
  welcomeMessage,
  "> Welcome to Thermes hackermans! Please login or register to start chatting with your friends.",
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
      startFlyingCubes();
      startFlyingGorilla();
      addMessage("GOBLIN MODE ACTIVATED!");
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});
