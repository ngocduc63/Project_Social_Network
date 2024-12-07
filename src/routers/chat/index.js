"use strict";

const express = require("express");
const { asyncHandler } = require("../../auth/checkAuth");
const { authentication } = require("../../auth/authUtils");
const { apiKey, permission } = require("../../auth/checkAuth");
const { uploadFileHandler } = require("../../helpers/uploadFIleHandler");
const chatController = require("../../controllers/chat.controller");

const upload = uploadFileHandler();
const router = express.Router();

//check apikey
router.use(apiKey);
//check pemission
router.use(permission("0000"));
// check access token
router.use(authentication);

router.get("/list-room", asyncHandler(chatController.getListRoom));
router.get("/get-room", asyncHandler(chatController.getRoom));
router.get("/get-members", asyncHandler(chatController.getMembersInRoom));
router.get("/list-mess", asyncHandler(chatController.getListMess));

router.post("/create-group", asyncHandler(chatController.createGroupChat));

router.put("/update-image-room", upload.single("room"), asyncHandler(chatController.updateImageRoom));
router.put("/update-name-room", asyncHandler(chatController.updateNameRoom));
router.put("/add-users-to-room", asyncHandler(chatController.addUsersToRoom));
router.put("/remove-users-to-room", asyncHandler(chatController.removeUsersFromGroup));
router.put("/leave-room", asyncHandler(chatController.userLeaveRooom));

module.exports = router;
