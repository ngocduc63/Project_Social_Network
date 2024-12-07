const ON_DISCONNECT = "disconnect";

const EVENT_IS_USER_ONLINE = "check_online";
const EVENT_SINGLE_CHAT_MESSAGE = "single_chat_message";

const SUB_EVENT_RECEIVE_MESSAGE = "receive_message";
const SUB_EVENT_RECEIVE_ROOM = "receive_user_room";
const SUB_EVENT_IS_USER_CONNECTED = "is_user_connected";
const SUB_EVENT_RECEIVE_NOTIFICATION = "receive_noti";
const SUB_EVENT_SEND_NOTIFICATION_POST = "notification_for_post";
const ON_CONNECTION = "connection";

const { Server } = require("socket.io");
const ChatService = require("./services/chat.service");
const CommonService = require("./services/common.service");

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
  notiUserOnline();
};

const notiUserOnline = () => {
  const userOnline = listUserOnline();
  for (const userId of userOnline) {
    io.to(`user_${userId.toString()}`).emit("user_online", userOnline);
  }
};

const listUserOnline = () => {
  return [...userMap.keys()];
};

const removeUserWithSocketIdFromMap = (socketId) => {
  for (const [userId, id] of userMap.entries()) {
    if (id === socketId) {
      userMap.delete(userId);
      break;
    }
  }
  notiUserOnline();
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
    await createAndNotiMess(roomId, content, sender);
  });
};

const createAndNotiMess = async (roomId, content, sender, type='text') => {
  const { rsMess, rsRoom } = await ChatService.createMessage(
    roomId,
    sender,
    content,
    type 
  );

  // noti for room
  io.to(roomId).emit(SUB_EVENT_RECEIVE_MESSAGE, rsMess);

  // noti for user
  for (const userId of rsRoom.room_members) {
    io.to(`chat_${userId.toString()}`).emit(SUB_EVENT_RECEIVE_ROOM, rsRoom);
    const dataNotiForUser = {
      data: rsRoom,
      noti_type: "message",
    };
    if (userId.toString() !== sender) {
      handleNotiForUser(dataNotiForUser, userId);
    }
  }
};

const onDisconnected = (socket) => {
  socket.on(ON_DISCONNECT, () => {
    removeUserWithSocketIdFromMap(socket.id);
  });
};

const handleRoom = (socket) => {
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
  });

  socket.on("leave_chat_list_room", (data) => {
    const { userId } = data;
    if (socket.rooms.has(`chat_${userId}`)) {
      socket.leave(`chat_${userId}`);
    }
  });

  // handle noti for user
  socket.on("join_noti_for_user", (data) => {
    const { userId } = data;
    socket.join(`user_${userId}`);

    const userOnline = listUserOnline();
    io.to(`user_${userId}`).emit("user_online", userOnline);
  });

  socket.on("leave_noti_for_user", (data) => {
    const { userId } = data;
    if (socket.rooms.has(`user_${userId}`)) {
      socket.leave(`user_${userId}`);
    }
  });
};

const handleCall = (socket) => {
  // room message
  socket.on("makeCall", async (data) => {
    const calleeId = data.calleeId;
    const sdpOffer = data.sdpOffer;
    const userInfo = await CommonService.getUserInfo(socket.user);

    socket.to(calleeId).emit("newCall", {
      callerId: socket.user,
      sdpOffer: sdpOffer,
      callerInfo: userInfo,
    });
  });

  socket.on("answerCall", (data) => {
    let callerId = data.callerId;
    let sdpAnswer = data.sdpAnswer;

    socket.to(callerId).emit("callAnswered", {
      callee: socket.user,
      sdpAnswer: sdpAnswer,
    });
  });

  socket.on("IceCandidate", (data) => {
    let calleeId = data.calleeId;
    let iceCandidate = data.iceCandidate;

    socket.to(calleeId).emit("IceCandidate", {
      sender: socket.user,
      iceCandidate: iceCandidate,
    });
  });

  socket.on("end_call", (data) => {
    let calleeId = data.calleeId;

    socket.to(calleeId).emit("end_call_noti", {
      sender: socket.user,
    });
  });
};

const handleNotiForUser = async (data, userId) => {
  await io
    .to(`user_${userId.toString()}`)
    .emit(SUB_EVENT_RECEIVE_NOTIFICATION, data);
};

const handleNotiForPost = async (data, postId) => {
  await io
    .to(`post_${postId}`)
    .emit(`${SUB_EVENT_SEND_NOTIFICATION_POST}_${postId}`, data);
};

const handleRoomNotiForPost = (socket) => {
  socket.on("join_post_noti", async (data) => {
    const { postId } = data;
    socket.join(`post_${postId}`);
    const postData = await CommonService.getPostInfo(postId);
    handleNotiForPost(postData, postId);
  });

  socket.on("leave_post_noti", (data) => {
    const { postId } = data;
    if (socket.rooms.has(`post_${postId}`)) {
      socket.leave(`post_${postId}`);
    }
  });
};

const onEachUserConnection = (socket) => {
  const fromUserId = socket.handshake.query.userId;
  socket.user = fromUserId;
  socket.join(fromUserId);
  addUserToMap(fromUserId, socket.id);
  console.log("🚀 ~ user conneect success:", fromUserId);

  handleRoom(socket);
  handleCall(socket);
  handleRoomNotiForPost(socket);
  onMessage(socket);
  checkOnline(socket);
  onDisconnected(socket);
};

module.exports = {
  setupSocketServer,
  handleNotiForUser,
  handleNotiForPost,
  listUserOnline,
  createAndNotiMess
};
