"use strict";

const { SuccessResponse } = require("../core/success.response");
const CommentService = require("../services/comment.service");

class CommentConstroller {
  createComment = async (req, res, next) => {
    const metadata = await CommentService.createComment(req.body, req.keyStore);
    new SuccessResponse(metadata, "Created Comment success!").send(res);
  };

  getCommentsByParentId = async (req, res, next) => {
    const metadata = await CommentService.getCommentsByParentId(req.body);
    new SuccessResponse(metadata).send(res);
  };

  deleteComment = async (req, res, next) => {
    new SuccessResponse(await CommentService.deleteComment(req.body, req.keyStore)).send(res);
  };

  updateComment = async (req, res, next) => {
    new SuccessResponse(await CommentService.updateComment(req.body, req.keyStore)).send(res);
  }
}

module.exports = new CommentConstroller();
