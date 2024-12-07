"use strict";

const { SuccessResponse } = require("../core/success.response");
const ChatService = require("../services/chat.service");

class ChatConstroller {
  createGroupChat = async (req, res, next) => {
    const metadata = await ChatService.createGroupChat(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  }

  getListRoom = async (req, res, next) => {
    const metadata = await ChatService.getListRoom(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  };

  updateNameRoom = async (req, res, next) => {
    const metadata = await ChatService.updateNameRoom(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  };

  addUsersToRoom = async (req, res, next) => {
    const metadata = await ChatService.addUsersToRoom(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  };

  removeUsersFromGroup = async (req, res, next) => {
    const metadata = await ChatService.removeUsersFromGroup(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  };

  getRoom = async (req, res, next) => {
    const metadata = await ChatService.getRoom(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  };

  getListMess = async (req, res, next) => {
    const metadata = await ChatService.getListMessage(req.body);
    new SuccessResponse(metadata).send(res);
  };

  updateImageRoom = async (req, res, next) => {
    const metadata = await ChatService.updateImageRoom(req.body, req.file, req.keyStore);
    new SuccessResponse(metadata, "update image success").send(res);
  };

  userLeaveRooom =  async (req, res, next) => {
    const metadata = await ChatService.userLeaveRoom(req.body, req.keyStore);
    new SuccessResponse(metadata, 'leave room success').send(res);
  }

  getMembersInRoom = async (req, res, next) => {
    const metadata = await ChatService.getMembersinRoom(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  }
}

module.exports = new ChatConstroller();
