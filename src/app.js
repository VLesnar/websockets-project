const http = require('http');
const socketio = require('socket.io');
const xxh = require('xxhashjs');
const fs = require('fs');

const avatar = fs.readFileSync(`${__dirname}/../client/coin.jpg`);
const groundImage = fs.readFileSync(`${__dirname}/../client/ground.jpg`);

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (request, response) => {
  if (request.url === '/ground.jpg') {
    response.writeHead(200, { 'Content-Type': 'image/jpg' });
    response.end(groundImage);
  } else if (request.url === '/coin.jpg') {
    response.writeHead(200, { 'Content-Type': 'image/jpg' });
    response.end(avatar);
  } else {
    fs.readFile(`${__dirname}/../client/index.html`,
    (err, data) => {
      if (err) {
        throw err;
      }
      response.writeHead(200);
      response.end(data);
    });
  }
};

const app = http.createServer(handler);
const io = socketio(app);

app.listen(port);

io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');

  socket.square = {
    hash: xxh.h32(`${socket.id}${Date.now()}`, 0xCAFEBABE).toString(16),
    lastUpdate: new Date().getTime(),
    x: 0,
    y: 0,
    r: 100,
    cx: 50,
    cy: 50,
    prevX: 0,
    prevY: 0,
    destX: 0,
    destY: 0,
    alpha: 0,
    height: 100,
    width: 100,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    colliding: false,
  };

  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = Date.now();

    socket.broadcast.to('room1').emit('updatedMovement', socket.square);
  });

  socket.on('textUpdate', (data) => {
    socket.text = {
      hash: xxh.h32(`${data}${Date.now()}`, 0xCAFEBABE).toString(16),
      txt: data,
    };
    io.sockets.in('room1').emit('updatedText', socket.text);
  });

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('disconnect', socket.square.hash);

    socket.leave('room1');
  });

  socket.emit('joined', socket.square);
});

console.log(`Listening on port: ${port}`);
