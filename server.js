<<<<<<< HEAD
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const bcrypt = require("bcryptjs");
=======
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
>>>>>>> parent of adec668 (patch 9.2.11)

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

<<<<<<< HEAD
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
=======
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
>>>>>>> parent of adec668 (patch 9.2.11)

// Add this route handler for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

<<<<<<< HEAD
const users = new Map();
const channels = ["general", "math"];
const userChannels = new Map();
const userColors = new Map();

function generateRandomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (users.has(username)) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.set(username, {
    password: hashedPassword,
    isAdmin: username === "Giuseppe",
  });
  userChannels.set(username, ["general"]);
  userColors.set(username, generateRandomColor());
  res.status(201).json({ message: "User registered successfully" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.get(username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ message: "Login successful", isAdmin: user.isAdmin });
});
=======
const users = new Set();
>>>>>>> parent of adec668 (patch 9.2.11)

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('user joined', (username) => {
    socket.username = username;
<<<<<<< HEAD
    socket.join("general");
    userChannels.get(username).forEach((channel) => socket.join(channel));
    io.emit("user joined", username);
    io.emit("update users", Array.from(users.keys()));
    io.emit("update channels", channels);
    socket.emit("update user channels", userChannels.get(username));
    socket.emit("set color", userColors.get(username));
  });

  socket.on("chat message", (data) => {
    io.to(data.channel).emit("chat message", {
      ...data,
      color: userColors.get(data.username),
    });
  });

  socket.on("typing", (data) => {
    socket
      .to(data.channel)
      .emit("typing", { username: socket.username, channel: data.channel });
  });

  socket.on("stop typing", (data) => {
    socket
      .to(data.channel)
      .emit("stop typing", {
        username: socket.username,
        channel: data.channel,
      });
  });

  socket.on("join channel", (channel) => {
    socket.join(channel);
    if (!userChannels.get(socket.username).includes(channel)) {
      userChannels.get(socket.username).push(channel);
    }
  });

  socket.on("create channel", (channel) => {
    if (!channels.includes(channel)) {
      channels.push(channel);
      io.emit("update channels", channels);
    }
  });

  socket.on("reply", (data) => {
    io.to(data.channel).emit("reply", {
      ...data,
      color: userColors.get(data.username),
    });
=======
    users.add(username);
    io.emit('user joined', username);
  });

  socket.on('chat message', (data) => {
    io.emit('chat message', data);
>>>>>>> parent of adec668 (patch 9.2.11)
  });

  socket.on('disconnect', () => {
    if (socket.username) {
<<<<<<< HEAD
      io.emit("user left", socket.username);
      io.emit("update users", Array.from(users.keys()));
=======
      users.delete(socket.username);
      io.emit('user left', socket.username);
>>>>>>> parent of adec668 (patch 9.2.11)
    }
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
