"use strict";

const { SuccessResponse } = require("../core/success.response");
const FriendService = require("../services/friend.service");
const LikeService = require("../services/like.service");

class FriendConstroller {
  addFriend = async (req, res, next) => { 
    const metadata = await FriendService.createFriend(req.body, req.keyStore)
    new SuccessResponse(metadata, "Add friend success").send(res);
  };

  acceptFriend = async (req, res, next) => { 
    const metadata = await FriendService.acceptFriend(req.body, req.keyStore)
    new SuccessResponse(metadata, "Accept friend success").send(res);
  };

  unfriend = async (req, res, next) => { 
    const metadata = await FriendService.unfriend(req.body, req.keyStore)
    new SuccessResponse(metadata, "unfriend success").send(res);
  }

  declineFriend = async (req, res, next) => {
    const metadata = await FriendService.declineFriend(req.body, req.keyStore)
    new SuccessResponse(metadata, "decline friend success").send(res);
  }

}

module.exports = new FriendConstroller();
