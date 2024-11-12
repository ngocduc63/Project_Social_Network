const ON_DISCONNECT = "disconnect";

const EVENT_IS_USER_ONLINE = "check_online";
const EVENT_SINGLE_CHAT_MESSAGE = "single_chat_message";

const SUB_EVENT_RECEIVE_MESSAGE = "receive_message";
const SUB_EVENT_RECEIVE_ROOM = "receive_user_room";
const SUB_EVENT_IS_USER_CONNECTED = "is_user_connected";
const SUB_EVENT_RECEIVE_NOTIFICATION = "receive_noti";
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
    const {rsMess, rsRoom} = await ChatService.createMessage(roomId, sender, content);
    // noti for room
    io.to(roomId).emit(SUB_EVENT_RECEIVE_MESSAGE, rsMess);

    // noti for user
    for (const userId of rsRoom.room_members){
      io.to(`chat_${userId.toString()}`).emit(SUB_EVENT_RECEIVE_ROOM, rsRoom);
      const dataNotiForUser = {
        data: rsRoom,
        type: "message"
      }
      if(userId.toString() !== sender){
        io.to(`user_${userId.toString()}`).emit(SUB_EVENT_RECEIVE_NOTIFICATION, dataNotiForUser);
      }
    }
  });
};

const onDisconnected = (socket) => {
  socket.on(ON_DISCONNECT, () => {
    removeUserWithSocketIdFromMap(socket.id);
  });
};

const handelRoom = (socket) => {
  // room message
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

  // handle chatlist
  socket.on("join_chat_list_room", (data) => {
    const { userId } = data;
    socket.join(`chat_${userId}`);
  })

  socket.on("leave_chat_list_room", (data) => {
    const { userId } = data;
    if (socket.rooms.has(`chat_${userId}`)) {
      socket.leave(`chat_${userId}`);
    }
  })

  // handle noti for user
  socket.on("join_noti_for_user", (data) => {
    const { userId } = data;
    socket.join(`user_${userId}`);
  })

  socket.on("leave_noti_for_user", (data) => {
    const { userId } = data;
    if (socket.rooms.has(`user_${userId}`)) {
      socket.leave(`user_${userId}`);
    }
  })
}

const onEachUserConnection = (socket) => {
  const fromUserId = socket.handshake.query.userId;
  addUserToMap(fromUserId, socket.id);
  console.log("🚀 ~ user conneect success:", fromUserId);
  
  handelRoom(socket);
  onMessage(socket);
  checkOnline(socket);
  onDisconnected(socket);
};

module.exports = { setupSocketServer };
