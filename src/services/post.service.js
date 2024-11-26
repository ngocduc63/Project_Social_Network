"user strict";

const { BadRequestError } = require("../core/error.response");
const post = require("../models/post.model");
const {
  convertToObjectIdMongodb,
  encodePathFile,
  uploadFileToGGDrive,
} = require("../utils");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");
const {
  POST_STATUS_TYPES,
  POST_IMAGE_CATEGORY,
} = require("../utils/const.post");
const { GENDER_USER, FRIEND_STATUS } = require("../utils/const.user");
const NotificationService = require("./notification.service");
const CommonService = require("./common.service");
const {
  allowedImageTypes,
  allowedVideoTypes,
} = require("../utils/const.common");
const { handleNotiForPost } = require("../socket_handle");

class PostService {
  static async getPostInfoById(postId, userId)  {
    const userIdMongo = convertToObjectIdMongodb(userId)
    const match = {
      _id: convertToObjectIdMongodb(postId),
    };
    const postData = await post.aggregate(this.getQueryInfoPost(match, userIdMongo));
    return postData[0];
  }

  static getQueryInfoPost(match, userIdMongo) {
    return [
      {
        $match: match,
      },
      {
        $lookup: {
          from: "Friends",
          let: { postAuthorId: "$created_by_user" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$friend_status", FRIEND_STATUS.FRIEND] },
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ["$created_by_user", userIdMongo] },
                            { $eq: ["$friend_userId", "$$postAuthorId"] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ["$created_by_user", "$$postAuthorId"] },
                            { $eq: ["$friend_userId", userIdMongo] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "friendRelation",
        },
      },
      {
        $addFields: {
          isFriend: { $gt: [{ $size: "$friendRelation" }, 0] },
        },
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
                    { $eq: ["$like_userId", userIdMongo] },
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
        $match: {
          $or: [
            { post_status: POST_STATUS_TYPES.PUBLIC_POST },
            {
              post_status: POST_STATUS_TYPES.PRIVATE_POST,
              created_by_user: userIdMongo,
            }, // Bài viết riêng tư của chính user
            {
              $and: [
                { post_status: POST_STATUS_TYPES.FRIEND_POST },
                { created_by_user: userIdMongo },
              ],
            },
            {
              $and: [
                { post_status: POST_STATUS_TYPES.FRIEND_POST },
                { isFriend: true },
              ],
            },
          ],
        },
      },
      // {
      //   $addFields: {
      //     layout: {
      //       $arrayElemAt: [
      //         ["classic", "column", "quote", "frame"],
      //         { $floor: { $multiply: [{ $rand: {} }, 4] } },
      //       ],
      //     },
      //   },
      // },
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
  }

  static getQueryNewFeed(userIdMongo) {
    const match = {
      $or: [
        { post_status: POST_STATUS_TYPES.PUBLIC_POST },
        {
          post_status: POST_STATUS_TYPES.PRIVATE_POST,
          created_by_user: userIdMongo,
        },
        { post_status: POST_STATUS_TYPES.FRIEND_POST },
      ],
    };
    return this.getQueryInfoPost(match, userIdMongo);
  }

  static async getPostForUser(
    { page = 1, limit = 20, offset = 0 },
    keyStore,
    query = []
  ) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const userIdMongo = convertToObjectIdMongodb(userId);

    if (query.length <= 0) query = this.getQueryNewFeed(userIdMongo);

    const posts = await post.aggregate([
      ...query,
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const countPostValid = await post.aggregate([
      ...query,
      { $count: "total" },
    ]);
    const total = countPostValid[0]?.total ? countPostValid[0].total : 0;

    return {
      posts: posts,
      totalPost: total,
      totalPage: Math.ceil(total / limit),
      page: page,
    };
  }

  static async createPost(body, keyStore, files) {
    const data = JSON.parse(body.data);
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    data.created_by_user = userId;
    data.post_image = await Promise.all(
      files
        .filter((file) => allowedImageTypes.includes(file.mimetype))
        .map(async (file) => await uploadFileToGGDrive(file))
    );

    data.post_video = await Promise.all(
      files
        .filter((file) => allowedVideoTypes.includes(file.mimetype))
        .map(async (file) => await uploadFileToGGDrive(file))
    );

    return await new Post(data).createPost();
  }

  static getPostById = async (postId) => {
    return await post.findById(convertToObjectIdMongodb(postId)).lean();
  };

  static async createPostImage(imagePathStr, userInfo, isUpdateAvatar = true) {
    const image_category = isUpdateAvatar
      ? POST_IMAGE_CATEGORY.AVATAR_IAMGE
      : POST_IMAGE_CATEGORY.COVER_IAMGE;
    const content = `đã cập nhật ${
      isUpdateAvatar ? "ảnh đại diện" : "ảnh bìa"
    } của ${userInfo.gender === GENDER_USER.MALE ? "anh ấy" : "cô ấy"}`;

    return await post.create({
      created_by_user: userInfo._id,
      image_category: image_category,
      post_image: imagePathStr,
      post_title: content,
    });
  }

  static async sharePost(
    { postId, content = "", postStatus = POST_STATUS_TYPES.PUBLIC_POST },
    keyStore
  ) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const postInfo = await this.getPostById(postId);

    if (!postInfo) throw new BadRequestError("Not found post");

    const rs = await post.create({
      post_title: content,
      created_by_user: userId,
      post_type: postId,
      post_status: postStatus,
    });
    if (!rs) throw new BadRequestError("Can not shsare post");

    this.updateNumShare(1, postId);

    const notiInfo = {
      type: NOTIFICATION_TYPES.SHARE_POST,
      receivedId: postInfo.created_by_user.toString(),
      senderId: userId,
      options: { postId: postId },
    };
    NotificationService.pushNotiToSystem(notiInfo);

    return true;
  }

  static async deletePost({ postId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const postInfo = await this.getPostById(postId);
    if (!postInfo) throw new BadRequestError("Not found post");

    const rs = await post.deleteOne({ _id: postId, created_by_user: userId });
    if (!rs) throw new BadRequestError("Error deleting post");

    if (postInfo.post_type)
      this.updateNumShare(-1, postInfo.post_type.toString());

    return true;
  }

  static async updatePost({ postId, content, images, status }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    await post.findOneAndUpdate(
      { _id: postId, created_by_user: userId },
      { $set: { post_title: content, post_image: images, post_status: status } }
    );

    return true;
  }

  static async updateNumComment(num, postId) {
    const rsPost = await post.findOneAndUpdate(
      {
        _id: convertToObjectIdMongodb(postId),
      },
      {
        $inc: { post_num_comment: num },
      },
      {
        returnDocument: "after",
      }
    );

    await handleNotiForPost(rsPost, postId);

    return rsPost;
  }

  static async updateNumLike(num, postId, likeCategory, postInfo, userId) {
    const postObjectId = convertToObjectIdMongodb(postId);

    const existingReaction = postInfo?.reactions.find(
      (reaction) => reaction.type === likeCategory
    );

    if (existingReaction) {
      if (existingReaction.count + num <= 0) {
        await post.updateOne(
          {
            _id: postObjectId,
          },
          {
            $pull: { reactions: { type: likeCategory } },
          }
        );
      } else {
        await post.updateOne(
          {
            _id: postObjectId,
            "reactions.type": likeCategory,
          },
          {
            $inc: { "reactions.$.count": num },
          }
        );
      }
    } else {
      await post.updateOne(
        {
          _id: postObjectId,
        },
        {
          $push: { reactions: { type: likeCategory, count: 1 } },
        }
      );
    }

    const resultPost = await post.findOneAndUpdate(
      {
        _id: postObjectId,
      },
      {
        $inc: { post_num_like: num },
      },
      {
        returnDocument: "after",
      }
    );

    resultPost.userId = userId;
    resultPost.likeCategory = likeCategory;
    await handleNotiForPost(resultPost, postId);

    return resultPost;
  }

  static async updateReactions(
    postId,
    likeCategory,
    postInfo,
    lastLikeCategory,
    userId
  ) {
    if (likeCategory === lastLikeCategory) return;

    const postObjectId = convertToObjectIdMongodb(postId);

    // update last reaction
    const lastReaction = postInfo?.reactions.find(
      (reaction) => reaction.type === lastLikeCategory
    );

    if (lastReaction.count === 1) {
      await post.updateOne(
        {
          _id: postObjectId,
        },
        {
          $pull: { reactions: { type: lastLikeCategory } },
        }
      );
    } else {
      await post.updateOne(
        {
          _id: postObjectId,
          "reactions.type": lastLikeCategory,
        },
        {
          $inc: { "reactions.$.count": -1 },
        }
      );
    }

    // update new reaction
    const existingReaction = postInfo?.reactions.find(
      (reaction) => reaction.type === likeCategory
    );

    if (existingReaction) {
      await post.updateOne(
        {
          _id: postObjectId,
          "reactions.type": likeCategory,
        },
        {
          $inc: { "reactions.$.count": 1 },
        }
      );
    } else {
      await post.updateOne(
        {
          _id: postObjectId,
        },
        {
          $push: { reactions: { type: likeCategory, count: 1 } },
        }
      );
    }

    const rsPost = await post.findById(postId).lean();
    rsPost.userId = userId;
    rsPost.likeCategory = likeCategory;
    await handleNotiForPost(rsPost, postId);

    return rsPost;
  }

  static async updateNumShare(num, postId) {
    const rsPost = await post.findOneAndUpdate(
      {
        _id: convertToObjectIdMongodb(postId),
      },
      {
        $inc: { post_num_share: num },
      },
      {
        returnDocument: "after",
      }
    );

    await handleNotiForPost(rsPost, postId);

    return rsPost;
  }
}

class Post {
  constructor({
    post_title,
    created_by_user,
    post_image,
    post_video,
    image_category = POST_IMAGE_CATEGORY.NORMAL_IAMGE,
    post_status = POST_STATUS_TYPES.PUBLIC_POST,
    post_type,
  }) {
    this.post_title = post_title;
    this.post_video = post_video;
    this.created_by_user = created_by_user;
    this.post_image = post_image;
    this.image_category = image_category;
    this.post_status = post_status;
    this.post_type = post_type ? post_type : null;
  }

  async createPost() {
    const newPost = await post.create(this);
    if (newPost) {
      await NotificationService.pushNotiToSystem({
        type: NOTIFICATION_TYPES.CREATE_POST,
        senderId: this.created_by_user,
        receivedId: this.created_by_user,
      }).then((rs) => console.log(rs));
    }

    return newPost;
  }
}

module.exports = PostService;
