"use strict";

const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const userService = require("../services/user.service");

class UserController {
  updateAvatar = async (req, res, next) => {
    const metadata = await userService.updateAvatarService(req.file, req.keyStore)
    new SuccessResponse(metadata).send(res);
  };

  updateCover = async (req, res, next) => {
    const metadata = await userService.updateCoverService(req.file, req.keyStore)
    new SuccessResponse(metadata).send(res);
  };
  
  getImageUrl = async (req, res, next) => {
    const imageStream = await userService.getImageUrl(req.params);

    res.contentType("image/png");

    imageStream.pipe(res);
  };
}

module.exports = new UserController();
