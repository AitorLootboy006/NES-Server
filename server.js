const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/", (_, res) => res.send("Servidor NES WebSocket activo"));

const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms = {};

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "join") {
        ws.room = data.room;
        rooms[data.room] = rooms[data.room] || [];
        rooms[data.room].push(ws);
        console.log(`Sala ${data.room}: ${rooms[data.room].length} jugadores conectados`);
      }
      if (data.type === "input" && ws.room) {
        rooms[ws.room].forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (err) {
      console.error("Error:", err);
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
      console.log(`Cliente salió de sala ${ws.room}`);
    }
  });
});

app.get("/status", (_, res) => {
  const summary = {};
  for (const room in rooms) {
    summary[room] = rooms[room].length;
  }
  res.json(summary);
});

server.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
