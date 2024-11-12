"use strict";

const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const { getAccessTokenStringee } = require("../helpers/getAccessTokenStringee");
const userService = require("../services/user.service");

class UserController {
  getUserInfo = async (req, res, next) => { 
    const metadata = await userService.getUserInfo(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  }

  getTokenStringee = async (req, res, next) => { 
    const metadata = await getAccessTokenStringee(req.keyStore);
    new SuccessResponse(metadata).send(res);
  }

  getPostOfUser = async (req, res, next) => {
    const metadata = await userService.getPostOfusser(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  }

  updateAvatar = async (req, res, next) => {
    const metadata = await userService.updateAvatarService(req.file, req.keyStore)
    new SuccessResponse(metadata).send(res);
  };

  updateCover = async (req, res, next) => {
    const metadata = await userService.updateCoverService(req.file, req.keyStore)
    new SuccessResponse(metadata).send(res);
  };
  
  getImageUrl = async (req, res, next) => {
    const fileResponse = await userService.getFileClound(req.params);
    res.contentType(fileResponse.headers["content-type"]);

    fileResponse.data.pipe(res);
  };

  getVideoUrl = async (req, res, next) => {
    const fileResponse = await userService.getFileClound(req.params);
    res.contentType(fileResponse.headers["content-type"]);

    fileResponse.data.pipe(res);
  };
}

module.exports = new UserController();
