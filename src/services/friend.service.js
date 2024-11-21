"use strict";

const Friend = require("../models/friend.model");
const { BadRequestError } = require("../core/error.response");
const { FRIEND_STATUS } = require("../utils/const.user");
const CommonService = require("./common.service");
const { convertToObjectIdMongodb } = require("../utils");
const ChatService = require("./chat.service");

class FriendService {
  static async getDataFriends(friends, userId) {
    const metadata = [];

    for (const friend of friends) {
      let friendInfo = {};
      if (userId === friend.created_by_user.toString())
        friendInfo = await CommonService.getUserInfo(friend.friend_userId);
      else friendInfo = await CommonService.getUserInfo(friend.created_by_user);

      friendInfo.createdAt = friend.createdAt;

      metadata.push(friendInfo);
    }

    return metadata;
  }

  static async countFriends(userId) {
    const numFriends = await Friend.countDocuments({
      $or: [{ created_by_user: userId }, { friend_userId: userId }],
      friend_status: FRIEND_STATUS.FRIEND,
    });

    return numFriends;
  }

  static async getMutualFriends(userId, friendId, limit = 6) {
    const mutualFriends = await Friend.aggregate([
      {
        $match: {
          friend_status: FRIEND_STATUS.FRIEND,
          $or: [
            { created_by_user: convertToObjectIdMongodb(userId) },
            { friend_userId: convertToObjectIdMongodb(userId) },
            { created_by_user: convertToObjectIdMongodb(friendId) },
            { friend_userId: convertToObjectIdMongodb(friendId) },
          ],
        },
      },
      {
        $group: {
          _id: null,
          user1Friends: {
            $addToSet: {
              $cond: [
                { $eq: ["$created_by_user", convertToObjectIdMongodb(userId)] },
                "$friend_userId",
                "$created_by_user",
              ],
            },
          },
          user2Friends: {
            $addToSet: {
              $cond: [
                {
                  $eq: ["$created_by_user", convertToObjectIdMongodb(friendId)],
                },
                "$friend_userId",
                "$created_by_user",
              ],
            },
          },
        },
      },
      {
        $project: {
          mutualFriends: {
            $setIntersection: ["$user1Friends", "$user2Friends"],
          },
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "mutualFriends",
          foreignField: "_id",
          as: "mutualFriendDetails",
        },
      },
      {
        $project: {
          mutualFriendDetails: {
            $map: {
              input: "$mutualFriendDetails",
              as: "friend",
              in: {
                _id: "$$friend._id",
                name: "$$friend.name",
                avatar: "$$friend.avatar",
              },
            },
          },
        },
      },
      { $unwind: "$mutualFriendDetails" },
      { $sort: { "mutualFriendDetails.createdAt": -1 } },
      { $limit: limit },
    ]);

    const latestMutualFriends = mutualFriends.map(
      (doc) => doc.mutualFriendDetails
    );
    const mutualFriendCount = latestMutualFriends.length;

    return { mutualFriendCount, latestMutualFriends };
  }

  static async getListFriend(
    { friendId, page = 1, limit = 50, offset = 0 },
    keyStore
  ) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const friend = await CommonService.getUserInfo(friendId);

    if (!friend) throw new BadRequestError("User not found");

    const checkExistFriend = await this.checkFriendExits(userId, friendId);
    if (!checkExistFriend?.friend_status === FRIEND_STATUS.FRIEND)
      throw new BadRequestError("Friend not found");

    const friends = await Friend.find({
      $or: [{ created_by_user: friendId }, { friend_userId: friendId }],
      friend_status: FRIEND_STATUS.FRIEND,
    })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Friend.countDocuments({
      $or: [{ created_by_user: friendId }, { friend_userId: friendId }],
      friend_status: FRIEND_STATUS.FRIEND,
    });

    const dataFriend = await this.getDataFriends(friends, userId);

    return {
      friends: dataFriend,
      page: page,
      totalFriend: total,
      totalPage: Math.ceil(total / limit),
      page: page,
    };
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
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const friend = await CommonService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const checkExistFriend = await this.checkFriendExits(userId, friendId);
    if (
      checkExistFriend &&
      checkExistFriend.friend_status !== FRIEND_STATUS.UNFRIEND
    ) {
      throw new BadRequestError("Friend already exists");
    }

    if (
      checkExistFriend &&
      checkExistFriend.friend_status == FRIEND_STATUS.UNFRIEND
    ) {
      let rs;
      if (checkExistFriend.created_by_user.toString() === userId) {
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
            $set: {
              created_by_user: userId,
              friend_userId: friendId,
              friend_status: FRIEND_STATUS.FOLLOW,
            },
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
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const friend = await CommonService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const rs = await Friend.findOneAndUpdate(
      { created_by_user: friendId, friend_userId: userId },
      { $set: { friend_status: FRIEND_STATUS.FRIEND } }
    );

    if (!rs) throw new BadRequestError("Not found friend");

    const data = await ChatService.createRoomChat(userId, [userId, friendId]);

    return {
      roomId: data._id.toString(),
    };
  }

  static async declineFriend({ friendId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const friend = await CommonService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const rs = await Friend.findOneAndUpdate({
      $or: [
        { created_by_user: userId, friend_userId: friendId },
        { created_by_user: friendId, friend_userId: userId },
      ],
      friend_status: FRIEND_STATUS.FOLLOW,
    },
    {
      $set:{
        friend_status: FRIEND_STATUS.UNFRIEND,
      }
    });
    if (!rs) throw new BadRequestError("Not found friend");

    return true;
  }

  static async unfriend({ friendId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const friend = await CommonService.getUserInfo(friendId);
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
