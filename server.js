const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const users = new Map();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("user joined", (username) => {
    socket.username = username;
    users.set(socket.id, username);
    io.emit("user joined", username);
    io.emit("update users", Array.from(users.values()));
  });

  socket.on("chat message", (data) => {
    io.emit("chat message", data);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      users.delete(socket.id);
      io.emit("user left", socket.username);
      io.emit("update users", Array.from(users.values()));
    }
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
