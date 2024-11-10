"use strict";

const { SuccessResponse } = require("../core/success.response");
const ChatService = require("../services/chat.service");

class ChatConstroller {
    getListRoom = async (req, res, next) => {
        const metadata = await ChatService.getListRoom(req.body, req.keyStore);
        new SuccessResponse(metadata).send(res);
      };
    
    getListMess = async (req, res, next) => {
      const metadata = await ChatService.getListMessage(req.body);
      new SuccessResponse(metadata).send(res);
    };
}

module.exports = new ChatConstroller();
