"user strict";

const post = require("../models/post.model");
const { convertToObjectIdMongodb } = require("../utils");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");
const {
  POST_STATUS_TYPES,
  POST_IMAGE_CATEGORY,
} = require("../utils/const.post");
const NotificationService = require("./notification.service");
const UserService = require("./user.service");

class PostService {
  static async createPost(body, keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);
    body.created_by_user = userId;

    return await new Post(body).createPost();
  }

  static async findPostById(idPost) {
    return await post.findById(idPost);
  }

  static async deletePost({postId}, keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);

    await post.findOneAndDelete({_id: postId, created_by_user: userId})

    return true;
  }

  static async updatePost({ postId, content, images, status }, keyStore) {
    const userId = await UserService.getUserIdByKeyStore(keyStore);
    
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
      NotificationService.pushNotiToSystem({
        type: NOTIFICATION_TYPES.CREATE_POST,
        senderId: this.created_by_user,
        receivedId: this.created_by_user,
      }).then((rs) => console.log(rs));
    }

    return newPost;
  }
}

module.exports = PostService;
