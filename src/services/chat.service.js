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

    await roomModel.findOneAndUpdate(
      { _id: roomId },
      { $set: { last_message: dataMess._id } }
    );

    const userInfo = await CommonService.getUserInfo(senderId)

    const rs = {
      ...dataMess.toObject(),
      sender: userInfo,
    }
    return rs;
  }

  static async getListRoom({ page = 1, limit = 10 }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const skip = (page - 1) * limit;

    const rooms = await roomModel
      .find({ room_members: { $in: [convertToObjectIdMongodb(userId)] } })
      .sort({updatedAt: -1})
      .skip(skip)
      .limit(limit);

    const roomTotal = await roomModel.countDocuments({
      room_members: { $in: [convertToObjectIdMongodb(userId)] },
    });

    const data = await Promise.all(
      rooms.map(async (room) => {
        const otherUserId = room.room_members.find(
          (memberId) => memberId.toString() !== userId.toString()
        );

        const otherUser = await CommonService.getUserInfo(otherUserId);
        const last_message = await messageModel.findById(room.last_message);

        return {
          ...room.toObject(),
          friend: otherUser,
          last_message_data: last_message,
        };
      })
    );

    return { rooms: data, totalPage: Math.ceil(roomTotal / limit), roomTotal };
  }

  static async getListMessage({ roomId, page = 1, limit = 20, offset = 0 }) {
    const skip = (page - 1) * limit + offset;
    const messages = await messageModel
      .find({ room_id: roomId })
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit);

    const messTotal = await messageModel.countDocuments({ room_id: roomId });

    const data = await Promise.all(
      messages.map(async (message) => {
        const userInfo = await CommonService.getUserInfo(
          message.created_by_user
        );

        return {
          ...message.toObject(),
          sender: userInfo,
        };
      })
    );

    return {
      messages: data,
      totalPage: Math.ceil(messTotal / limit),
      messTotal,
    };
  }
}

module.exports = ChatService;
