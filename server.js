const WebSocket = require('ws');
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Brigid pairing relay OK');
});
const wss = new WebSocket.Server({ server });
const rooms = new Map();
wss.on('connection', (ws) => {
  let roomCode = null;
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'join') {
        roomCode = msg.code;
        if (!rooms.has(roomCode)) rooms.set(roomCode, new Set());
        rooms.get(roomCode).add(ws);
        if (rooms.get(roomCode).size === 2) {
          rooms.get(roomCode).forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({type: 'paired'}));
          });
        }
      } else if (msg.type === 'feeling' && roomCode) {
        const room = rooms.get(roomCode);
        if (room) room.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) client.send(JSON.stringify(msg));
        });
      }
    } catch (e) {}
  });
  ws.on('close', () => {
    if (roomCode && rooms.has(roomCode)) {
      rooms.get(roomCode).delete(ws);
      if (rooms.get(roomCode).size === 0) rooms.delete(roomCode);
    }
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Relay on port ${PORT}`));
