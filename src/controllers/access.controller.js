"use strict";

const AccessService = require("../services/access.service");
const { OK, CREATED, SuccessResponse } = require("../core/success.response");

class AccessController {
  handlerRefreshToken = async (req, res, next) => {
    const metadata = await AccessService.handlerRefreshToken(req.body.refreshToken);
    new SuccessResponse(metadata, "Get token success").send(res);
  };

  logout = async (req, res, next) => {
    const metadata = await AccessService.logout(req.keyStore);
    new SuccessResponse(metadata, "Logout success").send(res);
  };

  login = async (req, res, next) => {
    const metadata = await AccessService.login(req.body);
    new SuccessResponse(metadata).send(res);
  };

  signUp = async (req, res, next) => {
    const metadata = await AccessService.signUp(req.body)
    const message = 'Register OK'
    const options = {
      limit: 10,
    }
    new CREATED(metadata, message, options).send(res);
  };
}

module.exports = new AccessController();
