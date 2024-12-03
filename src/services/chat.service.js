const { isTypedArray } = require("lodash");
const messageModel = require("../models/message.model");
const roomModel = require("../models/room.model");
const CommonService = require("./common.service");
const { convertToObjectIdMongodb } = require("../utils");
const { NotFoundError } = require("../core/error.response");

class ChatService {
  static async createRoomChat(userId, members, roomName = "") {
    const data = await roomModel.create({
      created_by_user: userId,
      room_name: roomName,
      room_members: members,
    });
    return data;
  }

  static async createGroupChat({members, roomName = ""}, keyStore){
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const data = await this.createRoomChat(userId, members, roomName);

    return data;
  }

  static async getDataMess(dataMess, senderId) {
    const userInfo = await CommonService.getUserInfo(senderId);

    return {
      ...dataMess.toObject(),
      sender: userInfo,
    };
  }

  static async createMessage(roomId, senderId, content, type = "text") {
    const dataMess = await messageModel.create({
      created_by_user: senderId,
      room_id: roomId,
      data: { content, type },
    });

    const dataRoom = await roomModel.findOneAndUpdate(
      { _id: roomId },
      { $set: { last_message: dataMess._id } },
      { new: true }
    );

    const rsMess = await this.getDataMess(dataMess, senderId);

    const rsRoom = await this.getDataRoom(dataRoom);

    return { rsMess, rsRoom };
  }

  static async getDataRoom(room) {
    const membersInfo = await Promise.all(
      room.room_members.map((memberId) => CommonService.getUserInfo(memberId))
    );

    const last_message = await messageModel.findById(room.last_message);
    let dataMess;
    if (last_message)
      dataMess = await this.getDataMess(
        last_message,
        last_message.created_by_user
      );

    return {
      ...room.toObject(),
      membersInfo,
      last_message_data: dataMess,
    };
  }

  static async getListRoom({ page = 1, limit = 10, offset = 0 }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const skip = (page - 1) * limit + offset;

    const rooms = await roomModel
      .find({ room_members: { $in: [convertToObjectIdMongodb(userId)] } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const roomTotal = await roomModel.countDocuments({
      room_members: { $in: [convertToObjectIdMongodb(userId)] },
    });

    const data = await Promise.all(
      rooms.map(async (room) => {
        return await this.getDataRoom(room, userId);
      })
    );

    return { rooms: data, totalPage: Math.ceil(roomTotal / limit), roomTotal };
  }

  static async checkRoomExist(friendId, userId) {
    const room = await roomModel.findOne({
      room_members: {
        $all: [
          convertToObjectIdMongodb(userId),
          convertToObjectIdMongodb(friendId),
        ],
      },
      $expr: { $eq: [{ $size: "$room_members" }, 2] },
    });
    return room;
  }

  static async getRoom({ friendId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const room = await roomModel.findOne({
      room_members: {
        $all: [
          convertToObjectIdMongodb(userId),
          convertToObjectIdMongodb(friendId),
        ],
      },
      $expr: { $eq: [{ $size: "$room_members" }, 2] },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    return await this.getDataRoom(room, userId);
  }

  static async getListMessage({ roomId, page = 1, limit = 20, offset = 0 }) {
    const skip = (page - 1) * limit + offset;
    const messages = await messageModel
      .find({ room_id: roomId })
      .sort({ createdAt: -1 })
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
