"use strict";

const Comment = require("../models/comment.model");
const { convertToObjectIdMongodb } = require("../utils");
const { NotFoundError } = require("../core/error.response");

class CommemtService {
  static async createComment({
    postId,
    userId,
    content,
    parentCommentId = null,
  }) {
    const comment = new Comment({
      comment_postId: postId,
      comment_userId: userId,
      comment_content: content,
      commnet_parentId: parentCommentId,
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

      console.log("max", maxRightValue);

      if (maxRightValue) {
        rightValue = maxRightValue.comment_right + 1;
      } else {
        rightValue = 1;
      }

      comment.comment_left = rightValue;
      comment.comment_right = rightValue + 1;
    }

    await comment.save();
    return comment;
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

      const comments = await Comment.find({
        comment_postId: convertToObjectIdMongodb(postId),
        comment_left: { $gt: parent.comment_left },
        comment_right: { $lte: parent.comment_right },
      })
        .select({
          comment_left: 1,
          comment_right: 1,
          comment_content: 1,
          comment_parentId: 1,
        })
        .sort({
          comment_left: 1,
        });

      return comments;
    }

    const comments = await Comment.find({
      comment_postId: convertToObjectIdMongodb(postId),
      commnet_parentId: parentCommentId,
    })
      .select({
        comment_left: 1,
        comment_right: 1,
        comment_content: 1,
        comment_parentId: 1,
      })
      .sort({
        comment_left: 1,
      });

    return comments;
  }
}

module.exports = CommemtService;
