const socket = io();
const loginForm = document.getElementById('login-form');
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const themeToggle = document.getElementById('theme-toggle');
const goblinOverlay = document.getElementById('goblin-overlay');

let username = '';
let goblinMode = false;
let flyingGoblins = [];
let flashingLights = [];

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  username = document.getElementById('username').value.trim();
  if (username) {
    socket.emit('user joined', username);
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    addMessage(`Welcome, ${username}! You've joined the chat.`);
  }
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (chatInput.value) {
    socket.emit('chat message', { username, message: chatInput.value });
    chatInput.value = '';
  }
});

socket.on('chat message', (data) => {
  addMessage(`${data.username}: ${data.message}`);
});

socket.on('user joined', (username) => {
  addMessage(`${username} has joined the chat.`);
});

socket.on('user left', (username) => {
  addMessage(`${username} has left the chat.`);
});

themeToggle.addEventListener('click', () => {
  goblinMode = !goblinMode;
  document.body.classList.toggle('goblin-mode');
  themeToggle.textContent = goblinMode ? 'Normal Mode' : 'Goblin Mode';
  if (goblinMode) {
    playGoblinSound();
    startFlyingGoblins();
    startFlashingLights();
  } else {
    stopFlyingGoblins();
    stopFlashingLights();
  }
});

function addMessage(text) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.textContent = `> ${text}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function typeEffect(element, text, index = 0) {
  if (index < text.length) {
    element.textContent += text[index];
    setTimeout(() => typeEffect(element, text, index + 1), 50);
  }
}

function playGoblinSound() {
  const audio = new Audio('https://www.soundjay.com/human/sounds/man-scream-01.mp3');
  audio.play();
}

function startFlyingGoblins() {
  for (let i = 0; i < 5; i++) {
    const goblin = document.createElement('div');
    goblin.classList.add('flying-goblin');
    goblin.style.top = `${Math.random() * 100}%`;
    goblin.style.left = `${Math.random() * 100}%`;
    goblinOverlay.appendChild(goblin);
    flyingGoblins.push(goblin);
  }
}

function stopFlyingGoblins() {
  flyingGoblins.forEach(goblin => goblin.remove());
  flyingGoblins = [];
}

function startFlashingLights() {
  for (let i = 0; i < 10; i++) {
    const light = document.createElement('div');
    light.classList.add('flashing-light');
    light.style.top = `${Math.random() * 100}%`;
    light.style.left = `${Math.random() * 100}%`;
    goblinOverlay.appendChild(light);
    flashingLights.push(light);
  }
}

function stopFlashingLights() {
  flashingLights.forEach(light => light.remove());
  flashingLights = [];
}

// Welcome message
const welcomeMessage = document.createElement('div');
welcomeMessage.classList.add('message');
chatMessages.appendChild(welcomeMessage);
typeEffect(welcomeMessage, '> Welcome to Terminal Friends Chat! Please login to start chatting with your friends.');

// Easter egg: Konami code for instant Goblin Mode
let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      goblinMode = true;
      document.body.classList.add('goblin-mode');
      themeToggle.textContent = 'Normal Mode';
      playGoblinSound();
      startFlyingGoblins();
      startFlashingLights();
      addMessage('GOBLIN MODE ACTIVATED!');
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});
