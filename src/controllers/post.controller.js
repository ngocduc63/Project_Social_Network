"use strict";

const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const PostService = require("../services/post.service");

class PostController {
  createPost = async (req, res, next) => {
    const metadata = await PostService.createPost(req.body);
    new SuccessResponse(metadata, "Create post success").send(res);
  };
}

module.exports = new PostController();
