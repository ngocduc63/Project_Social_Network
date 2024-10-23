"user strict";

const { BadRequestError } = require("../core/error.response");
const post = require("../models/post.model");
const { convertToObjectIdMongodb, encodePathFile } = require("../utils");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");
const {
  POST_STATUS_TYPES,
  POST_IMAGE_CATEGORY,
} = require("../utils/const.post");
const { GENDER_USER, FRIEND_STATUS } = require("../utils/const.user");
const NotificationService = require("./notification.service");
const CommonService = require("./common.service");

class PostService {
  static async getPostForUser({ page = 1, limit = 20, offset = 0 }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const userIdMongo = convertToObjectIdMongodb(userId);

    const num_page = parseInt(page) > 0 ? parseInt(page) : 1;
    const num_limit = parseInt(limit) > 0 ? parseInt(limit) : 20;

    const query = [
      {
        $match: {
          $or: [
            { post_status: POST_STATUS_TYPES.PUBLIC_POST }, // Lấy bài viết công khai
            {
              post_status: POST_STATUS_TYPES.PRIVATE_POST,
              created_by_user: userIdMongo,
            }, // Lấy bài viết riêng tư của chính người dùng
            { post_status: POST_STATUS_TYPES.FRIEND_POST }, // Lấy bài viết của bạn bè, kiểm tra trong aggregation
          ],
        },
      },
      {
        $lookup: {
          from: "Friends", // Tên collection chứa thông tin bạn bè
          let: { postAuthorId: "$created_by_user" }, // Đặt biến từ created_by_user của bài post
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$friend_status", FRIEND_STATUS.FRIEND] }, // Chỉ lấy các mối quan hệ bạn bè đã được chấp nhận
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
          as: "friendRelation", // Tên mảng lưu quan hệ bạn bè sau khi lookup
        },
      },
      {
        $addFields: {
          isFriend: { $gt: [{ $size: "$friendRelation" }, 0] }, // Nếu có quan hệ bạn bè thì isFriend = true
        },
      },
      {
        $lookup: {
          from: "Users", // Tên collection chứa thông tin người dùng
          localField: "created_by_user", // Trường trong bài viết
          foreignField: "_id", // Trường trong collection Users
          as: "userInfo", // Tên mảng lưu thông tin người dùng
        },
      },
      {
        $match: {
          $or: [
            { post_status: POST_STATUS_TYPES.PUBLIC_POST }, // Lấy bài viết công khai
            {
              post_status: POST_STATUS_TYPES.PRIVATE_POST,
              created_by_user: userIdMongo,
            }, // Bài viết riêng tư của chính user
            {
              $and: [
                { post_status: POST_STATUS_TYPES.FRIEND_POST },
                { created_by_user: userIdMongo },
              ],
            }, // Nếu người tạo bài viết là chính người dùng
            {
              $and: [
                { post_status: POST_STATUS_TYPES.FRIEND_POST },
                { isFriend: true },
              ],
            }, // Bài viết bạn bè nếu là bạn
          ],
        },
      },
      {
        $project: {
          _id: 1, 
          post_title: 1, 
          created_by_user: 1, 
          "userInfo._id": 1, 
          "userInfo.name": 1, 
          "userInfo.avatar": 1, 
          isFriend: 1, 
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const posts = await post.aggregate([
      ...query,
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (num_page - 1) * num_limit,
      },
      {
        $limit: num_limit,
      },
    ]);

    const countPostValid = await post.aggregate([
      ...query,
      { $count: "total" },
    ]);
    const total = countPostValid[0]?.total ? countPostValid[0].total : 0;

    return {
      posts: posts,
      totalPost: total,
      totalPage: Math.ceil(total / num_limit),
      page: num_page,
    };
  }

  static async createPost(body, keyStore, files) {
    const data = JSON.parse(body.data);
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    data.created_by_user = userId;
    data.post_image = files.map((image) => encodePathFile(image.path));

    return await new Post(data).createPost();
  }

  static getPostById = async (postId) => {
    return await post.findById(convertToObjectIdMongodb(postId));
  };

  static async createPostImage(imagePathStr, userInfo, isUpdateAvatar = true) {
    const image_category = isUpdateAvatar
      ? POST_IMAGE_CATEGORY.AVATAR_IAMGE
      : POST_IMAGE_CATEGORY.COVER_IAMGE;
    const content = `đã cập nhật ${
      isUpdateAvatar ? "ảnh đại diện" : "ảnh bìa"
    } của ${userInfo.gender === GENDER_USER.MALE ? "anh ấy" : "cô ấy"}`;

    return await post.create({
      created_by_user: userInfo._id,
      image_category: image_category,
      post_image: imagePathStr,
      post_title: content,
    });
  }

  static async sharePost(
    { postId, content = "", postStatus = POST_STATUS_TYPES.PUBLIC_POST },
    keyStore
  ) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);
    const postInfo = await this.getPostById(postId);

    if (!postInfo) throw new BadRequestError("Not found post");

    const rs = await post.create({
      post_title: content,
      created_by_user: userId,
      post_type: postId,
      post_status: postStatus,
    });
    if (!rs) throw new BadRequestError("Can not shsare post");

    this.updateNumShare(1, postId);

    return true;
  }

  static async deletePost({ postId }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    const postInfo = await this.getPostById(postId);
    if (!postInfo) throw new BadRequestError("Not found post");

    const rs = await post.deleteOne({ _id: postId, created_by_user: userId });
    if (!rs) throw new BadRequestError("Error deleting post");

    if (postInfo.post_type)
      this.updateNumShare(-1, postInfo.post_type.toString());

    return true;
  }

  static async updatePost({ postId, content, images, status }, keyStore) {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

    await post.findOneAndUpdate(
      { _id: postId, created_by_user: userId },
      { $set: { post_title: content, post_image: images, post_status: status } }
    );

    return true;
  }

  static async updateNumComment(num, postId) {
    await post.updateOne(
      {
        _id: convertToObjectIdMongodb(postId),
      },
      {
        $inc: { post_num_comment: num },
      }
    );
  }

  static async updateNumLike(num, postId) {
    await post.updateOne(
      {
        _id: convertToObjectIdMongodb(postId),
      },
      {
        $inc: { post_num_like: num },
      }
    );
  }

  static async updateNumShare(num, postId) {
    await post.updateOne(
      {
        _id: convertToObjectIdMongodb(postId),
      },
      {
        $inc: { post_num_share: num },
      }
    );
  }
}

class Post {
  constructor({
    post_title,
    created_by_user,
    post_image,
    image_category = POST_IMAGE_CATEGORY.NORMAL_IAMGE,
    post_status = POST_STATUS_TYPES.PUBLIC_POST,
    post_type,
  }) {
    this.post_title = post_title;
    this.created_by_user = created_by_user;
    this.post_image = post_image;
    this.image_category = image_category;
    this.post_status = post_status;
    this.post_type = post_type ? post_type : null;
  }

  async createPost() {
    const newPost = await post.create(this);
    if (newPost) {
      await NotificationService.pushNotiToSystem({
        type: NOTIFICATION_TYPES.CREATE_POST,
        senderId: this.created_by_user,
        receivedId: this.created_by_user,
      });
      // .then((rs) => console.log(rs));
    }

    return newPost;
  }
}

module.exports = PostService;
