"use strict";

const Friend = require("../models/friend.model");
const UserService = require("../services/user.service");
const { BadRequestError } = require("../core/error.response");
const { FRIEND_STATUS } = require("../utils/const.user");

class FriendService {
  static async getListFriend(keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);

    const rs = await Friend.find({
      $or: [{ created_by_user: userId }, { friend_userId: userId }],
    });
  }

  static async checkFriendExits(userId, friendId) {
    const rs = await Friend.findOne({
      $or: [
        { created_by_user: userId, friend_userId: friendId },
        { created_by_user: friendId, friend_userId: userId },
      ],
    });

    return rs;
  }

  static async createFriend({ friendId }, keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);

    const friend = await UserService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const checkExistFriend = await this.checkFriendExits(userId, friendId);

    if (checkExistFriend?.friend_status !== FRIEND_STATUS.UNFRIEND) {
      throw new BadRequestError("Friend already exists");
    }

    if (checkExistFriend?.friend_status == FRIEND_STATUS.UNFRIEND) {
      let rs;
      if ((checkExistFriend.created_by_user = userId)) {
        rs = await Friend.findOneAndUpdate(
          {
            created_by_user: userId,
            friend_userId: friendId,
          },
          {
            $set: { friend_status: FRIEND_STATUS.FOLLOW },
          }
        );
      } else {
        rs = await Friend.findOneAndUpdate(
          {
            created_by_user: friendId,
            friend_userId: userId,
          },
          {
            $set: { friend_status: FRIEND_STATUS.FOLLOW },
          }
        );
      }

      if (!rs) throw new BadRequestError("error add friend");

      return true;
    }

    const rs = await Friend.create({
      created_by_user: userId,
      friend_userId: friendId,
    });
    if (!rs) throw new BadRequestError("error add friend");

    return true;
  }

  static async acceptFriend({ friendId }, keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);

    const friend = await UserService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const rs = await Friend.findOneAndUpdate(
      { created_by_user: friendId, friend_userId: userId },
      { $set: { friend_status: FRIEND_STATUS.FRIEND } }
    );

    if (!rs) throw new BadRequestError("Not found friend");

    return true;
  }

  static async declineFriend({ friendId }, keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);

    const friend = await UserService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const rs = await Friend.findOneAndDelete({
      $or: [
        { created_by_user: userId, friend_userId: friendId },
        { created_by_user: friendId, friend_userId: userId },
      ],
      friend_status: FRIEND_STATUS.FOLLOW,
    });
    if (!rs) throw new BadRequestError("Not found friend");

    return true;
  }

  static async unfriend({ friendId }, keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);

    const friend = await UserService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const rs = await Friend.findOneAndUpdate(
      {
        $or: [
          { created_by_user: userId, friend_userId: friendId },
          { created_by_user: friendId, friend_userId: userId },
        ],
        friend_status: FRIEND_STATUS.FRIEND,
      },
      { $set: { friend_status: FRIEND_STATUS.UNFRIEND } }
    );

    if (!rs) throw new BadRequestError("Not found friend");

    return true;
  }
}

module.exports = FriendService;
