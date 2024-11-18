"user strict";

const { BadRequestError, NotFoundError } = require("../core/error.response");
const userModel = require("../models/user.model");
const path = require("path");
const fs = require("fs");
const {
  getInfoData,
  convertToObjectIdMongodb,
  decodePathFile,
  encodePathFile,
  getFileGGDriveById,
  uploadFileToGGDrive,
} = require("../utils");
const PostService = require("./post.service");
const CommonService = require("./common.service");
const FriendService = require("./friend.service");
const { FRIEND_STATUS } = require("../utils/const.user");
const { POST_STATUS_TYPES } = require("../utils/const.post");

class UserService {
  static findByEmail = async ({
    email,
    select = { email: 1, password: 2, name: 1, status: 1, roles: 1, avatar: 1 },
  }) => {
    return await userModel.findOne({ email }).select(select).lean();
  };

  static findById = async (id) => await userModel.findById(id).lean();

  static async getPostOfusser({ userId, page = 1, limit = 20 }, keyStore) {
    const userInfo = await userModel
      .findById(convertToObjectIdMongodb(userId))
      .lean();
    if (!userInfo) throw new NotFoundError(`User ${userId} does not exist`);

    const friendId = await CommonService.getUserIdByKeyStore(keyStore);
    const userIdMongo = convertToObjectIdMongodb(userId);
    const userIdRequest= convertToObjectIdMongodb(friendId);
    const matchCondition = {
      created_by_user: userIdMongo,
    };

    if (friendId !== userId) {
      const checkFriend = await FriendService.checkFriendExits(
        userId,
        friendId
      );

      if (checkFriend?.friend_status === FRIEND_STATUS.FRIEND) {
        matchCondition.$or = [
          { post_status: POST_STATUS_TYPES.PUBLIC_POST },
          { post_status: POST_STATUS_TYPES.FRIEND_POST },
        ];
      } else if (
        checkFriend?.friend_status === FRIEND_STATUS.FOLLOW ||
        checkFriend?.friend_status === FRIEND_STATUS.UNFRIEND
      ) {
        matchCondition.$or = [{ post_status: POST_STATUS_TYPES.PUBLIC_POST }];
      }
    }
    
    const query = [
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "Users",
          localField: "created_by_user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $lookup: {
          from: "Likes",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$like_postId", "$$postId"] },
                    { $eq: ["$like_userId", userIdRequest] },
                  ],
                },
              },
            },
          ],
          as: "userLike",
        },
      },
      {
        $addFields: {
          hasLiked: { $gt: [{ $size: "$userLike" }, 0] },
          likeCategory: { $arrayElemAt: ["$userLike.like_category", 0] },
        },
      },
      {
        $addFields: {
          layout: "classic",
        },
      },
      {
        $project: {
          _id: 1,
          post_title: 1,
          created_by_user: 1,
          post_image: 1,
          post_video: 1,
          "user._id": 1,
          "user.name": 1,
          "user.avatar": 1,
          isFriend: 1,
          createdAt: 1,
          updatedAt: 1,
          post_num_comment: 1,
          post_num_like: 1,
          post_num_share: 1,
          hasLiked: 1,
          likeCategory: 1,
          layout: 1,
          reactions: 1,
          post_status: 1,
        },
      },
    ];

    return await PostService.getPostForUser({ page, limit }, keyStore, query);
  }

  static async getUserInfo({ userId }, keyStore) {
    const userInfo = await userModel
      .findById(convertToObjectIdMongodb(userId))
      .lean();

    const friendId = await CommonService.getUserIdByKeyStore(keyStore);

    if (friendId !== userId) {
      const { mutualFriendCount, latestMutualFriends } =
        await FriendService.getMutualFriends(userId, friendId);
      userInfo.friends = await FriendService.countFriends(
        userInfo._id.toString()
      );
      userInfo.mutualFriends = mutualFriendCount;
      userInfo.latestMutualFriends = latestMutualFriends;

      const checkFriend = await FriendService.checkFriendExits(
        userInfo._id.toString(),
        friendId
      );
      if (checkFriend)
        userInfo.isFriend = checkFriend.friend_status === FRIEND_STATUS.FRIEND;
      else userInfo.isFriend = false;
    } else {
      userInfo.friends = await FriendService.countFriends(userId);
    }

    userInfo.guard = true;

    return getInfoData({
      fileds: [
        "_id",
        "name",
        "avatar",
        "gender",
        "cover",
        "createdAt",
        "friends",
        "isFriend",
        "hometown",
        "address",
        "bio",
        "guard",
        "mutualFriends",
        "latestMutualFriends",
      ],
      object: userInfo,
    });
  }

  static updateAvatarService = async (file, keyStore) => {
    if (!file) throw new BadRequestError("file not found");
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const user = await this.findById(userId);

    if (!user) throw new BadRequestError("user not found");

    const imagePath = await uploadFileToGGDrive(file);
    const rs = await userModel.updateOne(
      { _id: userId },
      { $set: { avatar: imagePath } }
    );

    // check update success
    if (!rs.acknowledged) throw new BadRequestError("update avatar error");

    const userResult = await this.findById(userId);

    // create post avatar
    const postUpdateAvatar = await PostService.createPostImage(
      imagePath,
      userResult
    );

    return {
      user: getInfoData({
        fileds: ["_id", "name", "avatar"],
        object: userResult,
      }),
      post: getInfoData({
        fileds: [
          "_id",
          "post_title",
          "post_image",
          "image_category",
          "createdAt",
        ],
        object: postUpdateAvatar,
      }),
    };
  };

  static updateCoverService = async (file, keyStore) => {
    if (!file) throw new BadRequestError("file not found");
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const user = await this.findById(userId);

    if (!user) throw new BadRequestError("user not found");

    const imagePath = await uploadFileToGGDrive(file);
    const rs = await userModel.updateOne(
      { _id: userId },
      { $set: { cover: imagePath } }
    );

    // check update success
    if (!rs.acknowledged) throw new BadRequestError("update avatar error");

    const userResult = await this.findById(userId);

    // create post cover
    const postUpdateCover = await PostService.createPostImage(
      imagePath,
      userResult,
      false
    );

    return {
      user: getInfoData({
        fileds: ["_id", "name", "cover"],
        object: userResult,
      }),
      post: getInfoData({
        fileds: [
          "_id",
          "post_title",
          "post_image",
          "image_category",
          "createdAt",
        ],
        object: postUpdateCover,
      }),
    };
  };

  static getFileUrl = async ({ filename }) => {
    const pathImage = decodePathFile(filename);
    const filepath = path.join(__dirname, "../../uploads", pathImage);

    // Kiểm tra file có tồn tại không
    if (fs.existsSync(filepath)) return fs.createReadStream(filepath);
    else throw new BadRequestError("file not found");
  };

  static getFileClound = async ({ filename }) => {
    return await getFileGGDriveById(filename);
  };

  static updateProfile = async (body) => {
    return true;
  };

  static changePassword = async (body) => {
    return true;
  };
}

module.exports = UserService;
