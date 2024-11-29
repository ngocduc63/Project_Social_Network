"use strict";

const Friend = require("../models/friend.model");
const { BadRequestError } = require("../core/error.response");
const { FRIEND_STATUS } = require("../utils/const.user");
const CommonService = require("./common.service");
const { convertToObjectIdMongodb } = require("../utils");
const ChatService = require("./chat.service");
const NotificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");

class FriendService {
  static async getDataFriends(friends, userId) {
    const metadata = [];

    for (const friend of friends) {
      let friendInfo = {};
      if (userId === friend.created_by_user.toString())
        friendInfo = await CommonService.getUserInfo(friend.friend_userId);
      else friendInfo = await CommonService.getUserInfo(friend.created_by_user);

      friendInfo.createdAt = friend.createdAt;
      friendInfo.countMutual = await this.countMutualFriend(userId, friendInfo._id.toString());

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

  static async countMutualFriend(userId, friendId) {
    const mutualFriendsCount = await Friend.aggregate([
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
        $facet: {
          user1Friends: [
            {
              $match: {
                $or: [
                  { created_by_user: convertToObjectIdMongodb(userId) },
                  { friend_userId: convertToObjectIdMongodb(userId) },
                ],
              },
            },
            {
              $project: {
                friend_userId: {
                  $cond: [
                    {
                      $eq: [
                        "$created_by_user",
                        convertToObjectIdMongodb(userId),
                      ],
                    },
                    "$friend_userId",
                    "$created_by_user",
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                user1Friends: { $addToSet: "$friend_userId" },
              },
            },
          ],
          user2Friends: [
            {
              $match: {
                $or: [
                  { created_by_user: convertToObjectIdMongodb(friendId) },
                  { friend_userId: convertToObjectIdMongodb(friendId) },
                ],
              },
            },
            {
              $project: {
                friend_userId: {
                  $cond: [
                    {
                      $eq: [
                        "$created_by_user",
                        convertToObjectIdMongodb(friendId),
                      ],
                    },
                    "$friend_userId",
                    "$created_by_user",
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                user2Friends: { $addToSet: "$friend_userId" },
              },
            },
          ],
        },
      },
      {
        $project: {
          mutualFriends: {
            $setIntersection: [
              { $arrayElemAt: ["$user1Friends.user1Friends", 0] },
              { $arrayElemAt: ["$user2Friends.user2Friends", 0] },
            ],
          },
        },
      },
      {
        $match: {
          mutualFriends: { $ne: [] },
        },
      },
      {
        $project: {
          mutualFriendsCount: { $size: "$mutualFriends" },
        },
      },
    ]);

    const count =
      mutualFriendsCount.length > 0
        ? mutualFriendsCount[0].mutualFriendsCount
        : 0;
    return count;
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
        $facet: {
          user1Friends: [
            {
              $match: {
                $or: [
                  { created_by_user: convertToObjectIdMongodb(userId) },
                  { friend_userId: convertToObjectIdMongodb(userId) },
                ],
              },
            },
            {
              $project: {
                friend_userId: {
                  $cond: [
                    {
                      $eq: [
                        "$created_by_user",
                        convertToObjectIdMongodb(userId),
                      ],
                    },
                    "$friend_userId",
                    "$created_by_user",
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                user1Friends: { $addToSet: "$friend_userId" },
              },
            },
          ],
          user2Friends: [
            {
              $match: {
                $or: [
                  { created_by_user: convertToObjectIdMongodb(friendId) },
                  { friend_userId: convertToObjectIdMongodb(friendId) },
                ],
              },
            },
            {
              $project: {
                friend_userId: {
                  $cond: [
                    {
                      $eq: [
                        "$created_by_user",
                        convertToObjectIdMongodb(friendId),
                      ],
                    },
                    "$friend_userId",
                    "$created_by_user",
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                user2Friends: { $addToSet: "$friend_userId" },
              },
            },
          ],
        },
      },
      {
        $project: {
          mutualFriends: {
            $setIntersection: [
              { $arrayElemAt: ["$user1Friends.user1Friends", 0] },
              { $arrayElemAt: ["$user2Friends.user2Friends", 0] },
            ],
          },
        },
      },
      {
        $match: {
          mutualFriends: { $ne: [] },
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
                createdAt: "$$friend.createdAt",
              },
            },
          },
        },
      },
      {
        $unwind: {
          path: "$mutualFriendDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { "mutualFriendDetails.createdAt": -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const latestMutualFriends = mutualFriends
      .map((doc) => doc.mutualFriendDetails)
      .filter((friend) => friend);

    const mutualFriendCount = await this.countMutualFriend(userId, friendId);

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

  static async getListFollower({ userId, page = 1, limit = 20, ofset = 0 }) {
    const skip = (page - 1) * limit;

    const friends = await Friend.find({
      friend_userId: userId,
      friend_status: FRIEND_STATUS.FOLLOW,
    })
      .populate({
        path: "created_by_user",
        select: "name avatar",
      })
      .skip(skip)
      .limit(limit);

    const count = await Friend.countDocuments({
      friend_userId: userId,
      friend_status: FRIEND_STATUS.FOLLOW,
    });

    const rs = [];
    for (let friend of friends) {
      const friendId = friend.created_by_user._id.toString();
      const countMutual = await this.countMutualFriend(userId, friendId);
      rs.push({
        '_id': friend._id,
        'created_by_user': friend.created_by_user,
        'friend_userId': friend.friend_userId,
        'createdAt': friend.createdAt,
        'countMutual': countMutual,
      })
    }

    return {
      friends: rs,
      page: page,
      totalFriend: count,
      totalPage: Math.ceil(count / limit),
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

      await NotificationService.pushNotiToSystem({
        type: NOTIFICATION_TYPES.ADD_FRIEND,
        receivedId: friendId,
        senderId: userId,
      });

      return true;
    }

    const rs = await Friend.create({
      created_by_user: userId,
      friend_userId: friendId,
    });
    if (!rs) throw new BadRequestError("error add friend");

    await NotificationService.pushNotiToSystem({
      type: NOTIFICATION_TYPES.ADD_FRIEND,
      receivedId: friendId,
      senderId: userId,
    });
    return true;
  }

  static async acceptFriend({ friendId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const friend = await CommonService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const checkExistFriend = await this.checkFriendExits(userId, friendId);
    if (
      checkExistFriend &&
      checkExistFriend.friend_status === FRIEND_STATUS.FRIEND
    ) {
      throw new BadRequestError("is friend");
    }

    const rs = await Friend.findOneAndUpdate(
      { created_by_user: friendId, friend_userId: userId },
      { $set: { friend_status: FRIEND_STATUS.FRIEND } }
    );

    if (!rs) throw new BadRequestError("Not found friend");
    const dataRoom = await ChatService.checkRoomExist(friendId, userId);

    if (!dataRoom) {
      await ChatService.createRoomChat(userId, [userId, friendId]);
    }

    await NotificationService.pushNotiToSystem({
      type: NOTIFICATION_TYPES.ACCEPT_FRIEND,
      receivedId: friendId,
      senderId: userId,
    });

    return true;
  }

  static async declineFriend({ friendId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const friend = await CommonService.getUserInfo(friendId);
    if (!friend) throw new BadRequestError("Not found friend");

    const rs = await Friend.findOneAndUpdate(
      {
        $or: [
          { created_by_user: userId, friend_userId: friendId },
          { created_by_user: friendId, friend_userId: userId },
        ],
        friend_status: FRIEND_STATUS.FOLLOW,
      },
      {
        $set: {
          friend_status: FRIEND_STATUS.UNFRIEND,
        },
      }
    );
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
