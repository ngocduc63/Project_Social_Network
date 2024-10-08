"use strict";

const NotiModel = require("../models/notification.model");
const { convertToObjectIdMongodb } = require("../utils");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");

class NotificationService {
  static async pushNotiToSystem({
    type = NOTIFICATION_TYPES.CREATE_POST,
    receivedId,
    senderId,
    options = {},
  }) {
    let noti_content;

    if (type === NOTIFICATION_TYPES.CREATE_POST) {
      noti_content = "vua tao bai viet";
    } else if (type === NOTIFICATION_TYPES.LIKE_POST) {
      noti_content = "vua like bai viet";
    } else if (type === NOTIFICATION_TYPES.COMMENT_POST){
      noti_content = "vua comment bai viet";
    } else if (type === NOTIFICATION_TYPES.SHARE_POST){
      noti_content = "vua share bai viet";
    } else if (type === NOTIFICATION_TYPES.ADD_FRIEND){
      noti_content = "vua gui loi moi ket ban";
    } else if (type === NOTIFICATION_TYPES.ACCEPT_FRIEND){
      noti_content = "vua chap nhan loi moi ket ban";
    }

    const newNoti = await NotiModel.create({
      noti_type: type,
      noti_content,
      noti_senderId: senderId,
      noti_receivedId: receivedId,
      noti_options: options,
    });

    return newNoti;
  }

  static async listNotiByUser({
    userId,
    type = NOTIFICATION_TYPES.GET_ALL,
    isRead = 0,
  }) {
    const match = { noti_receivedId: convertToObjectIdMongodb(userId) };
    if (type !== NOTIFICATION_TYPES.GET_ALL) {
      match["noti_type"] = type;
    }

    return await NotiModel.aggregate([
      {
        $match: match,
      },
      {
        $project: {
          noti_type: 1,
          noti_senderId: 1,
          noti_receivedId: 1,
          noti_content: 1,
          createdAt: 1,
        },
      },
    ]);
  }
}

module.exports = NotificationService;
