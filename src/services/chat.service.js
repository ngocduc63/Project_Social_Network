const { isTypedArray } = require("lodash");
const messageModel = require("../models/message.model");
const roomModel = require("../models/room.model");
const CommonService = require("./common.service");
const UserService = require("./user.service");
const { convertToObjectIdMongodb } = require("../utils");

class ChatService {
  static async createRoomChat(userId, members, roomName = "") {
    await roomModel.create({
      created_by_user: userId,
      room_name: roomName,
      room_members: members,
    });
  }

  static async createMessage(roomId, senderId, content, type = "text") {
    const dataMess = await messageModel.create({
      created_by_user: senderId,
      room_id: roomId,
      data: { content, type },
    });

    await roomModel.findOneAndUpdate({_id: roomId}, {$set: {last_message: dataMess._id}})
  }

  static async getListRoom({ page = 1, limit = 10 }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
  
    const skip = (page - 1) * limit;
  
    const rooms = await roomModel.find(
      { room_members: { $in: [convertToObjectIdMongodb(userId)] } }
    )
    .skip(skip)
    .limit(limit);
  
    const data = await Promise.all(rooms.map(async (room) => {
        const otherUserId = room.room_members.find(memberId => memberId.toString() !== userId.toString());
    
        const otherUser = await CommonService.getUserInfo(otherUserId);
        const last_message = await messageModel.findById(room.last_message)

        return {
          ...room.toObject(),
          friend: otherUser,
          last_message_data: last_message
        };
      }));
  
    return data;
  }
  
}

module.exports = ChatService;
