const socket = io();
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const themeToggle = document.getElementById('theme-toggle');
const goblinOverlay = document.getElementById('goblin-overlay');
const onlineUsers = document.getElementById('online-users');
const fileInput = document.getElementById('file-input');
const fileButton = document.getElementById('file-button');
const channelList = document.getElementById('channel-list');
const channelName = document.getElementById('channel-name');
const createChannelForm = document.getElementById('create-channel-form');
const colorPicker = document.getElementById('user-color');

let username = '';
let isAdmin = false;
let goblinMode = false;
let flyingGoblins = [];
let flashingLights = [];
let currentChannel = 'general';
let userColor = '#00ff00';
let channelLogs = {};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      isAdmin = data.isAdmin;
      userColor = data.color;
      colorPicker.value = userColor;
      loginContainer.style.display = 'none';
      chatContainer.style.display = 'flex';
      socket.emit('user joined', { username, color: userColor });
      addMessage(`Welcome, ${username}! You've joined the chat.`);
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newUsername = document.getElementById('new-username').value.trim();
  const newPassword = document.getElementById('new-password').value;
  
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Registration successful. Please log in.');
      document.getElementById('username').value = newUsername;
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (chatInput.value) {
    socket.emit('chat message', { username, message: chatInput.value, channel: currentChannel, color: userColor });
    chatInput.value = '';
  }
});

createChannelForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newChannel = document.getElementById('new-channel').value.trim();
  if (newChannel && isAdmin) {
    socket.emit('create channel', newChannel);
    document.getElementById('new-channel').value = '';
  }
});

chatInput.addEventListener('input', () => {
  socket.emit('typing', { username, channel: currentChannel });
});

chatInput.addEventListener('blur', () => {
  socket.emit('stop typing', { username, channel: currentChannel });
});

fileButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      socket.emit('chat message', { username, message: `Sent a file: ${file.name}`, file: event.target.result, channel: currentChannel, color: userColor });
    };
    reader.readAsDataURL(file);
  }
});

colorPicker.addEventListener('change', (e) => {
  userColor = e.target.value;
  socket.emit('color change', { username, color: userColor });
});

socket.on('chat message', (data) => {
  if (data.channel === currentChannel) {
    if (data.file) {
      addMessage(`${data.username}: ${data.message}`, data.file, data.color);
    } else {
      addMessage(`${data.username}: ${data.message}`, null, data.color);
    }
  } else {
    notifyNewMessage(data.channel);
  }
  saveMessageToChannelLog(data);
});

socket.on('reply', (data) => {
  if (data.channel === currentChannel) {
    addReply(data);
  } else {
    notifyNewMessage(data.channel);
  }
  saveMessageToChannelLog(data);
});

socket.on('user joined', (data) => {
  addMessage(`${data.username} has joined the chat.`);
  updateOnlineUsers(data.users);
});

socket.on('user left', (data) => {
  addMessage(`${data.username} has left the chat.`);
  updateOnlineUsers(data.users);
});

socket.on('update users', (users) => {
  updateOnlineUsers(users);
});

socket.on('update channels', (channels) => {
  updateChannelList(channels);
});

socket.on('update user channels', (userChannels) => {
  updateChannelList(userChannels);
});

socket.on('typing', (data) => {
  if (data.channel === currentChannel) {
    addTypingIndicator(data.username);
  }
});

socket.on('stop typing', (data) => {
  if (data.channel === currentChannel) {
    removeTypingIndicator(data.username);
  }
});

socket.on('channel deleted', (channel) => {
  if (channel === currentChannel) {
    switchChannel('general');
  }
  updateChannelList(channels.filter(c => c !== channel));
  delete channelLogs[channel];
});

themeToggle.addEventListener('click', () => {
  goblinMode = !goblinMode;
  document.body.classList.toggle('goblin-mode');
  themeToggle.textContent = goblinMode ? 'Normal Mode' : 'Goblin Mode';
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

function addMessage(text, file = null, color = '#0f0') {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.innerHTML = `<span style="color: ${color}">> ${text}</span>`;
  
  if (file) {
    const fileExtension = file.split(';')[0].split('/')[1];
    if (['jpeg', 'jpg', 'png', 'gif'].includes(fileExtension)) {
      const img = document.createElement('img');
      img.src = file;
      messageElement.appendChild(img);
    } else {
      const link = document.createElement('a');
      link.href = file;
      link.textContent = 'Download File';
      link.download = 'file.' + fileExtension;
      messageElement.appendChild(link);
    }
  }
  
  const replyButton = document.createElement('button');
  replyButton.textContent = 'Reply';
  replyButton.addEventListener('click', () => startReply(text));
  messageElement.appendChild(replyButton);
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addReply(data) {
  const replyElement = document.createElement('div');
  replyElement.classList.add('reply');
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
  onlineUsers.innerHTML = '<h3>Online Users</h3>';
  users.forEach(user => {
    const userElement = document.createElement('div');
    userElement.textContent = user.username;
    userElement.style.color = user.color;
    onlineUsers.appendChild(userElement);
  });
}

function updateChannelList(channels) {
  channelList.innerHTML = '<h3>Channels</h3>';
  channels.forEach(channel => {
    const channelElement = document.createElement('div');
    channelElement.textContent = channel;
    channelElement.classList.add('channel');
    channelElement.addEventListener('click', () => switchChannel(channel));
    
    if (isAdmin && channel !== 'general') {
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';
      deleteButton.classList.add('delete-channel');
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteChannel(channel);
      });
      channelElement.appendChild(deleteButton);
    }
    
    channelList.appendChild(channelElement);
  });
}

function switchChannel(channel) {
  currentChannel = channel;
  channelName.textContent = channel;
  chatMessages.innerHTML = '';
  socket.emit('join channel', channel);
  addMessage(`Switched to channel: ${channel}`);
  
  // Load channel logs
  if (channelLogs[channel]) {
    channelLogs[channel].forEach(msg => addMessage(msg.text, msg.file, msg.color));
  }
}

function deleteChannel(channel) {
  if (confirm(`Are you sure you want to delete the channel "${channel}"?`)) {
    socket.emit('delete channel', channel);
  }
}

function notifyNewMessage(channel) {
  const channelElement = channelList.querySelector(`.channel:contains('${channel}')`);
  if (channelElement) {
    channelElement.classList.add('new-message');
  }
}

function addTypingIndicator(username) {
  let typingElement = document.getElementById(`typing-${username}`);
  if (!typingElement) {
    typingElement = document.createElement('div');
    typingElement.classList.add('typing-indicator');
    typingElement.id = `typing-${username}`;
    chatMessages.appendChild(typingElement);
  }
  typingElement.textContent = `${username} is typing...`;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator(username) {
  const typingElement = document.getElementById(`typing-${username}`);
  if (typingElement) {
    typingElement.remove();
  }
}

function saveMessageToChannelLog(data) {
  if (!channelLogs[data.channel]) {
    channelLogs[data.channel] = [];
  }
  channelLogs[data.channel].push({
    text: `${data.username}: ${data.message}`,
    file: data.file,
    color: data.color
  });
}

// ... (rest of the code remains the same)
