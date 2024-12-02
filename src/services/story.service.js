"use strict";

const { BadRequestError } = require("../core/error.response");
const { convertToObjectIdMongodb, uploadFileToGGDrive } = require("../utils");
const { POST_STATUS_TYPES } = require("../utils/const.post");
const NotificationService = require("./notification.service");
const CommonService = require("./common.service");
const {
  allowedImageTypes,
  allowedVideoTypes,
} = require("../utils/const.common");
const storyModel = require("../models/story.model");
const { FRIEND_STATUS } = require("../utils/const.user");

class StoryService {
  static getQueryStory(match, userIdMongo) {
    return [
      {
        $match: match,
      },
      {
        $lookup: {
          from: "Friends",
          let: { postAuthorId: "$created_by_user" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$friend_status", FRIEND_STATUS.FRIEND] },
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ["$created_by_user", userIdMongo] },
                            { $eq: ["$friend_userId", "$$postAuthorId"] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ["$created_by_user", "$$postAuthorId"] },
                            { $eq: ["$friend_userId", userIdMongo] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "friendRelation",
        },
      },
      {
        $addFields: {
          isFriend: { $gt: [{ $size: "$friendRelation" }, 0] },
        },
      },
      {
        $match: {
          $or: [
            { story_status: POST_STATUS_TYPES.PUBLIC_POST },
            {
              story_status: POST_STATUS_TYPES.PRIVATE_POST,
              created_by_user: userIdMongo,
            },
            {
              $and: [
                { story_status: POST_STATUS_TYPES.FRIEND_POST },
                { created_by_user: userIdMongo },
              ],
            },
            {
              $and: [
                { story_status: POST_STATUS_TYPES.FRIEND_POST },
                { isFriend: true },
              ],
            },
          ],
        },
      },
      {
        $group: {
          _id: "$created_by_user",
          listStory: { $push: "$$ROOT" },
          lastStory: { $last: "$$ROOT" },
        },
      },
      {
        $addFields: {
          listStory: {
            $sortArray: { input: "$listStory", sortBy: { createdAt: -1 } },
          },
        },
      },
      {
        $lookup: {
          from: "Users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $project: {
          _id: 1, // user ID
          "user._id": 1, // user ID
          "user.name": 1, // user name
          "user.avatar": 1, // user avatar
          listStory: {
            _id: 1,
            story_title: 1,
            story_image: 1,
            story_video: 1,
            story_status: 1,
            createdAt: 1,
            isFriend: 1,
            "user._id": 1,
            "user.name": 1,
            "user.avatar": 1,
          },
          lastStory: {
            _id: 1,
            story_title: 1,
            story_image: 1,
            story_video: 1,
            story_status: 1,
            createdAt: 1,
            "user._id": 1,
            "user.name": 1,
            "user.avatar": 1,
            isFriend: 1,
          },
        },
      },
    ];
  }

  static async createStory(body, keyStore, files) {
    const data = JSON.parse(body.data);
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    data.story_image = await Promise.all(
      files
        .filter((file) => allowedImageTypes.includes(file.mimetype))
        .map(async (file) => await uploadFileToGGDrive(file))
    );

    data.story_video = await Promise.all(
      files
        .filter((file) => allowedVideoTypes.includes(file.mimetype))
        .map(async (file) => await uploadFileToGGDrive(file))
    );

    const rs = await storyModel.create({
      story_title: data.story_title,
      story_status: data.story_status ? POST_STATUS_TYPES.PUBLIC_POST : data.story_status,
      created_by_user: convertToObjectIdMongodb(userId),
      story_image: data.story_image[0],
      story_video: data.story_video[0],
    });

    return rs;
  }

  static async getListStory({ page = 1, limit = 10, offset = 0 }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const userIdMongo = convertToObjectIdMongodb(userId);
    const match = {
      $and: [
        {
          $or: [
            { story_status: POST_STATUS_TYPES.PUBLIC_POST },
            {
              story_status: POST_STATUS_TYPES.PRIVATE_POST,
              created_by_user: userIdMongo,
            },
            { story_status: POST_STATUS_TYPES.FRIEND_POST },
          ],
        },
        {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      ],
    };

    const query = this.getQueryStory(match, userIdMongo);

    const storys = await storyModel.aggregate([
      ...query,
      {
        $sort: { "lastStory.createdAt": -1 },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const countStoryValid = await storyModel.aggregate([
      ...query,
      { $count: "total" },
    ]);
    const total = countStoryValid[0]?.total ? countStoryValid[0].total : 0;

    return {
      storys: storys,
      totalPost: total,
      totalPage: Math.ceil(total / limit),
      page: page,
    };
  }
}

module.exports = StoryService;
