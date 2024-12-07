"user stricy";

const { getInfoData, convertToObjectIdMongodb } = require("../utils");
const post = require("../models/post.model");
const User = require("../models/user.model");
const roomModel = require("../models/room.model");
const messageModel = require("../models/message.model");

class CommonService {
  static getUserInfo = async (userId) => {
    const userInfo = await User.findById(userId);
    return getInfoData({
      fileds: ["_id", "name", "avatar"],
      object: userInfo,
    });
  };

  static getPostInfo = async (postId) => {
    return await post.findById(convertToObjectIdMongodb(postId)).lean();
  };

  static getUserIdByKeyStore = async (keyStore) => {
    return await keyStore.user.toString();
  };

  static async getDataMess(dataMess, senderId) {
    const userInfo = await CommonService.getUserInfo(senderId);

    return {
      ...dataMess.toObject(),
      sender: userInfo,
    };
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

}

module.exports = CommonService
