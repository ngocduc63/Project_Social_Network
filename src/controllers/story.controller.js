"use strict";

const StoryService = require("../services/story.service");
const { OK, CREATED, SuccessResponse } = require("../core/success.response");

class StoryController {
  createStory = async (req, res, next) => {
    const metadata = await StoryService.createStory(
      req.body,
      req.keyStore,
      req.files
    );
    new SuccessResponse(metadata, "Create story success").send(res);
  };

  getStoryForUser = async (req, res, next) => {
    const metadata = await StoryService.getListStory(req.body, req.keyStore);
    new SuccessResponse(metadata).send(res);
  };
}

module.exports = new StoryController();
