"use strict";

const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const NotificationService = require("../services/notification.service");

class NotificationController {
  getListNotiByUser = async (req, res, next) => {
    const metadata = await NotificationService.listNotiByUser(req.body);
    new SuccessResponse(metadata).send(res);
  };
}

module.exports = new NotificationController();
