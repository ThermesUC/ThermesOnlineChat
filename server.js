const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = new Map();
const userChannels = new Map();
const userColors = new Map();
const channels = ['general', 'math'];
const channelLogs = new Map();

function generateRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.has(username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.set(username, { password: hashedPassword, isAdmin: username === 'Giuseppe' });
    userChannels.set(username, ['general']);
    userColors.set(username, generateRandomColor());
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', isAdmin: user.isAdmin, color: userColors.get(username) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('user joined', (data) => {
    socket.username = data.username;
    socket.join('general');
    userChannels.get(data.username).forEach(channel => socket.join(channel));
    userColors.set(data.username, data.color);
    io.emit('user joined', { username: data.username, users: Array.from(users.keys()).map(u => ({ username: u, color: userColors.get(u) })) });
    io.emit('update channels', channels);
    socket.emit('update user channels', userChannels.get(data.username));
  });

  socket.on('chat message', (data) => {
    io.to(data.channel).emit('chat message', data);
    saveMessageToChannelLog(data);
  });

  socket.on('typing', (data) => {
    socket.to(data.channel).emit('typing', data);
  });

  socket.on('stop typing', (data) => {
    socket.to(data.channel).emit('stop typing', data);
  });

  socket.on('join channel', (channel) => {
    socket.join(channel);
    if (!userChannels.get(socket.username).includes(channel)) {
      userChannels.get(socket.username).push(channel);
    }
  });

  socket.on('create channel', (channel) => {
    if (!channels.includes(channel)) {
      channels.push(channel);
      channelLogs.set(channel, []);
      io.emit('update channels', channels);
    }
  });

  socket.on('delete channel', (channel) => {
    if (channel !== 'general') {
      const index = channels.indexOf(channel);
      if (index > -1) {
        channels.splice(index, 1);
        channelLogs.delete(channel);
        io.emit('channel deleted', channel);
        io.emit('update channels', channels);
      }
    }
  });

  socket.on('color change', (data) => {
    userColors.set(data.username, data.color);
    io.emit('update users', Array.from(users.keys()).map(username => ({
      username,
      color: userColors.get(username)
    })));
  });

  socket.on('reply', (data) => {
    io.to(data.channel).emit('reply', data);
    saveMessageToChannelLog(data);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('user left', { username: socket.username, users: Array.from(users.keys()).map(u => ({ username: u, color: userColors.get(u) })) });
    }
    console.log('User disconnected');
  });
});

function saveMessageToChannelLog(data) {
  if (!channelLogs.has(data.channel)) {
    channelLogs.set(data.channel, []);
  }
  channelLogs.get(data.channel).push(data);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
