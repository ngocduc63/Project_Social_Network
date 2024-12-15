"use strict";

const Comment = require("../models/comment.model");
const { convertToObjectIdMongodb, getInfoData } = require("../utils");
const { NotFoundError } = require("../core/error.response");
const PostService = require("./post.service");
const NotificationService = require("./notification.service");
const CommonService = require("./common.service");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");
const { handleNotiForComment } = require("../socket_handle");

class CommemtService {
  static async createComment({ postId, content, parentCommentId }, keyStore) {
    const postInfo = await PostService.getPostById(postId);
    if (!postInfo) throw new NotFoundError("Not found post");

    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const comment = new Comment({
      comment_postId: postId,
      comment_userId: userId,
      comment_content: content,
      commnet_parentId: parentCommentId ? parentCommentId : null,
    });

    let rightValue;
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) throw new NotFoundError("parent comment not found");

      rightValue = parentComment.comment_right;

      await Comment.updateMany(
        {
          comment_postId: convertToObjectIdMongodb(postId),
          comment_right: { $gte: rightValue },
        },
        {
          $inc: { comment_right: 2 },
        }
      );

      await Comment.updateMany(
        {
          comment_postId: convertToObjectIdMongodb(postId),
          comment_left: { $gte: rightValue },
        },
        {
          $inc: { comment_left: 2 },
        }
      );
    } else {
      const maxRightValue = await Comment.findOne(
        {
          comment_postId: convertToObjectIdMongodb(postId),
        },
        "comment_right",
        { sort: { comment_right: -1 } }
      );

      if (maxRightValue) {
        rightValue = maxRightValue.comment_right + 1;
      } else {
        rightValue = 1;
      }
    }

    comment.comment_left = rightValue;
    comment.comment_right = rightValue + 1;
    await comment.save();

    // icrease num comment in post:
    await PostService.updateNumComment(1, postId);

    // notifi
    const receivedId = postInfo.created_by_user.toString();
    if (userId !== receivedId) {
      const notiInfo = {
        type: NOTIFICATION_TYPES.COMMENT_POST,
        receivedId: receivedId,
        senderId: userId,
        options: { postId },
      };
      NotificationService.pushNotiToSystem(notiInfo);
    }

    // get data cmt
    const dataRes = comment.toJSON();
    const userInfo = await CommonService.getUserInfo(userId);
    dataRes.user = userInfo;
    dataRes.content = comment.comment_content;
    dataRes.postId = comment.comment_postId;
    dataRes.postId = comment.comment_postId;
    dataRes.countChildComment = 0;

    const rs = getInfoData({
      fileds: [
        "_id",
        "user",
        "content",
        "postId",
        "createdAt",
        "countChildComment",
        'commnet_parentId',
      ],
      object: dataRes,
    });

    await handleNotiForComment(rs, postId);

    return rs
  }

  static async findCommentByParentId(
    postId,
    parentCommentId,
    parent,
    page,
    limit
  ) {
    const totalComments = await Comment.countDocuments({
      comment_postId: convertToObjectIdMongodb(postId),
      comment_parentId: convertToObjectIdMongodb(parentCommentId),
      comment_left: { $gt: parent.comment_left },
      comment_right: { $lte: parent.comment_right },
    });

    const comments = await Comment.find({
      comment_postId: convertToObjectIdMongodb(postId),
      commnet_parentId: convertToObjectIdMongodb(parentCommentId),
      comment_left: { $gt: parent.comment_left },
      comment_right: { $lte: parent.comment_right },
    })
      .select({
        comment_left: 1,
        comment_right: 1,
        comment_content: 1,
        comment_parentId: 1,
        comment_userId: 1,
        comment_postId: 1,
        createdAt: 1,
      })
      .sort({
        createdAt: -1,
        comment_left: 1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    return { comments, totalComments };
  }

  static async findCommentByPostId(postId, page, limit) {
    const totalComments = await Comment.countDocuments({
      comment_postId: convertToObjectIdMongodb(postId),
      commnet_parentId: null,
    });

    const comments = await Comment.find({
      comment_postId: convertToObjectIdMongodb(postId),
      commnet_parentId: null,
    })
      .select({
        comment_left: 1,
        comment_right: 1,
        comment_content: 1,
        comment_parentId: 1,
        comment_userId: 1,
        comment_postId: 1,
        createdAt: 1,
      })
      .sort({
        createdAt: -1,
        comment_left: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    return { comments, totalComments };
  }

  static async commentCountForParentId(postId, parentCommentId, parent) {
    const commentCount = await Comment.countDocuments({
      comment_postId: convertToObjectIdMongodb(postId),
      commnet_parentId: convertToObjectIdMongodb(parentCommentId),
      comment_left: { $gt: parent.comment_left },
      comment_right: { $lte: parent.comment_right },
    });

    return commentCount;
  }

  static async getDataComments(postId, comments) {
    const rs = [];
    for (const comment of comments) {
      const countChildComment = await this.commentCountForParentId(
        postId,
        comment.id,
        comment
      );

      const userInfo = await CommonService.getUserInfo(comment.comment_userId);
      rs.push({
        _id: comment._id.toString(),
        postId: comment.comment_postId,
        content: comment.comment_content,
        parentId: comment.comment_parentId,
        createdAt: comment.createdAt,
        countChildComment,
        user: userInfo,
      });
    }

    return rs;
  }

  static async getCommentsByParentId({
    postId,
    parentCommentId = null,
    page = 1,
    limit = 10,
    offset = 0,
  }) {
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent) throw new NotFoundError("Not found comment for post");

      const { comments, totalComments } = await this.findCommentByParentId(
        postId,
        parentCommentId,
        parent,
        page,
        limit
      );

      const data = await this.getDataComments(postId, comments);
      return {
        comments: data,
        page,
        totalPage: Math.ceil(totalComments / limit),
        totalComments,
      };
    } else {
      const { comments, totalComments } = await this.findCommentByPostId(
        postId,
        page,
        limit
      );

      const data = await this.getDataComments(postId, comments);
      return {
        comments: data,
        page,
        totalPage: Math.ceil(totalComments / limit),
        totalComments,
      };
    }
  }

  static async deleteComment({ postId, commentId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const post = await PostService.getPostById(postId);
    if (!post) throw new NotFoundError("Not found post");

    const comment = await Comment.findOne({
      _id: commentId,
      comment_userId: userId,
    });
    if (!comment) throw new NotFoundError("Not found comment");

    const leftValue = comment.comment_left;
    const rightValue = comment.comment_right;
    const width = rightValue - leftValue + 1;
    const num_comment_deleted = +(width / 2);

    // delete all comment child
    await Comment.deleteMany({
      comment_postId: convertToObjectIdMongodb(postId),
      comment_left: { $gte: leftValue, $lte: rightValue },
    });

    // update left and right value
    await Comment.updateMany(
      {
        comment_postId: convertToObjectIdMongodb(postId),
        comment_right: { $gt: rightValue },
      },
      {
        $inc: { comment_right: -width },
      }
    );

    await Comment.updateMany(
      {
        comment_postId: convertToObjectIdMongodb(postId),
        comment_left: { $gt: rightValue },
      },
      {
        $inc: { comment_left: -width },
      }
    );

    // update post
    await PostService.updateNumComment(-num_comment_deleted, postId);

    return true;
  }

  static async updateComment({ commentId, content }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    await Comment.findByIdAndUpdate(
      { _id: commentId, comment_userId: userId },
      { $set: { comment_content: content } }
    );

    return true;
  }
}

module.exports = CommemtService;
