const ON_DISCONNECT = "disconnect";

const EVENT_IS_USER_ONLINE = "check_online";
const EVENT_SINGLE_CHAT_MESSAGE = "single_chat_message";

const SUB_EVENT_RECEIVE_MESSAGE = "receive_message";
const SUB_EVENT_IS_USER_CONNECTED = "is_user_connected";
const ON_CONNECTION = "connection";

const { Server } = require("socket.io");
const ChatService = require("./services/chat.service");

let io;

const userMap = new Map();

const setupSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  io.on(ON_CONNECTION, (socket) => {
    onEachUserConnection(socket);
  });
};

const addUserToMap = (userId, socketId) => {
  userMap.set(userId, socketId);
};

const removeUserWithSocketIdFromMap = (socketId) => {
  for (const [userId, id] of userMap.entries()) {
    if (id === socketId) {
      userMap.delete(userId);
      break;
    }
  }
};

const isUserOnline = (userId) => {
  return userMap.has(userId);
};

const checkOnline = (socket) => {
  socket.on(EVENT_IS_USER_ONLINE, (chatUserDetails) => {
    const isOnline = isUserOnline(chatUserDetails.to);
    chatUserDetails.to_user_online_status = isOnline;
    socket.emit(SUB_EVENT_IS_USER_CONNECTED, chatUserDetails);
  });
};

const onMessage = (socket) => {
  socket.on(EVENT_SINGLE_CHAT_MESSAGE, async (chatMessage) => {
    const { roomId, content, sender, type } = chatMessage;
    const dataMess = await ChatService.createMessage(roomId, sender, content);
    io.to(roomId).emit(SUB_EVENT_RECEIVE_MESSAGE, dataMess);
  });
};

const onDisconnected = (socket) => {
  socket.on(ON_DISCONNECT, () => {
    removeUserWithSocketIdFromMap(socket.id);
  });
};

const onEachUserConnection = (socket) => {
  const fromUserId = socket.handshake.query.userId;
  addUserToMap(fromUserId, socket.id);
  console.log("🚀 ~ user conneect success:", fromUserId);

  socket.on("join_room", (data) => {
    const { roomId } = data;
    socket.join(roomId);
  });

  socket.on("leave_room", (data) => {
    const { roomId } = data;
    if (socket.rooms.has(roomId)) {
      socket.leave(roomId);
    }
  });

  onMessage(socket);
  checkOnline(socket);
  onDisconnected(socket);
};

module.exports = { setupSocketServer };
