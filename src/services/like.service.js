"use strict";

const Like = require("../models/like.model");
const { convertToObjectIdMongodb } = require("../utils");
const { NotFoundError, BadRequestError } = require("../core/error.response");
const UserService = require("./user.service");
const PostService = require("./post.service");
const { LIKE_CATEGORY } = require("../utils/const.post");
const NotificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");
const CommonService = require("./common.service");

class LikeService {
  static checkuserLiked(userId, postId) {
    const likeInfo = Like.findOne({
      like_userId: convertToObjectIdMongodb(userId),
      like_postId: convertToObjectIdMongodb(postId),
    });

    return likeInfo;
  }

  static async createLike({ postId, likeCategory }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const category = likeCategory ? likeCategory : LIKE_CATEGORY.LIKE;

    const userInfo = await CommonService.getUserInfo(userId);
    if (!userInfo) throw new NotFoundError("User not found");

    const postInfo = await PostService.getPostById(postId);
    if (!postInfo) throw new NotFoundError("Post not found");

    const likeInfo = await this.checkuserLiked(userId, postId);
    if (likeInfo) throw new BadRequestError("User liked");

    await Like.create({
      like_postId: postId,
      like_userId: userId,
      like_category: category,
    });

    PostService.updateNumLike(1, postId);

    // notifi
    NotificationService.pushNotiToSystem(NOTIFICATION_TYPES.LIKE_POST, userId, postInfo.created_by_user)

    return true;
  }

  static async deleteLike({ likeId, postId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const postInfo = await PostService.getPostById(postId);
    if (!postInfo) throw new NotFoundError("Post not found");

    await Like.findOneAndDelete({ _id: likeId, like_userId: userId });

    PostService.updateNumLike(-1, postId);

    return true;
  }

  static async getDataListLike(likes){
    const rs = [];

    for (const like of likes) {
      const userInfo  = await CommonService.getUserInfo(like.like_userId)

      rs.push({
        id: like._id.toString(),
        category: like.like_category,
        createdAt: like.createdAt,
        userInfo: userInfo
      })
    }

    return rs;
  }

  static async getListUserLikedSerVice({postId, limit = 50, offset = 0}) {
    const postInfo = await PostService.getPostById(postId);
    if (!postInfo) throw new NotFoundError("Post not found");

    const dataLikes = await Like.find({like_postId: postId})

    return this.getDataListLike(dataLikes)
  }
}

module.exports = LikeService;
