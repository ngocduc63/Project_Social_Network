"use strict";

const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const PostService = require("../services/post.service");

class PostController {
  createPost = async (req, res, next) => {
    const metadata = await PostService.createPost(req.body, req.keyStore, req.files);
    new SuccessResponse(metadata, "Create post success").send(res);
  };

  sharePost = async (req, res, next) => {
    const metadata = await PostService.sharePost(req.body, req.keyStore);
    new SuccessResponse(metadata, "Share post success").send(res);
  }

  updatePost = async(req, res, next) => { 
    new SuccessResponse(await PostService.updatePost(req.body, req.keyStore), "Update post success").send(res);
  }

  deletePost = async(req, res, next) => {
    new SuccessResponse(await PostService.deletePost(req.body, req.keyStore), "Delete post success").send(res);
  }
}

module.exports = new PostController();
