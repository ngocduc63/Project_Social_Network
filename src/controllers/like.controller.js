"use strict";

const { SuccessResponse } = require("../core/success.response");
const LikeService = require("../services/like.service");

class CommentConstroller {
  createLike = async (req, res, next) => {
    const metadata = await LikeService.createLike(req.body, req.keyStore);
    new SuccessResponse(metadata, "Created like success!").send(res);
  };

  deleteLike = async (req, res, next) => { 
    const metadata = await LikeService.deleteLike(req.body);
    new SuccessResponse(metadata, "Delete like success!").send(res);
  }
  
}

module.exports = new CommentConstroller();
