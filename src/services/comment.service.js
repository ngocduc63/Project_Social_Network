"use strict";

const Comment = require("../models/comment.model");
const { convertToObjectIdMongodb } = require("../utils");
const { NotFoundError } = require("../core/error.response");
const UserService = require("./user.service");
const PostService = require("./post.service");

class CommemtService {
  static async createComment(
    { postId, content, parentCommentId },
    keyStore
  ) {
    const userId = keyStore.user.toString();
    console.log("user", userId);
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
    return comment;
  }

  static async findCommentByParentId(postId, parentCommentId, parent) {
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
      })
      .sort({
        comment_left: 1,
      });

    return comments;
  }

  static async findCommentByPostId(postId) {
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
      })
      .sort({
        comment_left: 1,
      });

    return comments;
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

      const userInfo = await UserService.getUserInfo(comment.comment_userId);

      rs.push({
        id: comment._id.toString(),
        content: comment.comment_content,
        parentId: comment.comment_parentId,
        countChildComment,
        userInfo,
      });
    }

    return rs;
  }

  static async getCommentsByParentId({
    postId,
    parentCommentId = null,
    limit = 50,
    offset = 0,
  }) {
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent) throw new NotFoundError("Not found comment for post");

      const comments = this.getDataComments(
        postId,
        await this.findCommentByParentId(postId, parentCommentId, parent)
      );

      return comments;
    }

    const comments = this.getDataComments(
      postId,
      await this.findCommentByPostId(postId)
    );
    return comments;
  }

  static async deleteComment({postId, commentId}) {
    const post = await PostService.findPostById(postId);
    if (!post) throw new NotFoundError("Not found post");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new NotFoundError("Not found comment");

    const leftValue = comment.comment_left
    const rightValue = comment.comment_right
    const widtth = rightValue - leftValue + 1

    // delete all comment child
    await Comment.deleteMany({
      comment_postId: convertToObjectIdMongodb(postId),
      comment_left: {$gte: leftValue, $lte: rightValue}
    })

    // update left and right value
    await Comment.updateMany({
      comment_postId: convertToObjectIdMongodb(postId),
      comment_right: {$gt: rightValue}
    },{
      $inc: {comment_right: -widtth}
    })

    await Comment.updateMany({
      comment_postId: convertToObjectIdMongodb(postId),
      comment_left: {$gt: rightValue}
    },{
      $inc: {comment_left: -widtth}
    })

    return true
  }

  static async updateComment({commentId, content}){
    return {'mess': 'success'}
  }
}

module.exports = CommemtService;
