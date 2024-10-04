"user strict";

const post = require("../models/post.model");
const { NOTIFICATION_TYPES } = require("../utils/const.notification");
const NotificationService = require("./notification.service");

class PostService {
  static async createPost(body) {
    return await new Post(body).createPost();
  }
  
  static async findPostById(idPost) {
    return await post.findById(idPost);
  }

  static async deletePost(postId) {
    return true;
  }

  static async updatePost(body) {
    return true;
  }

}

class Post {
  constructor({
    post_title,
    created_by_user,
    post_image,
    image_category,
    post_status,
    post_type,
  }) {
    this.post_title = post_title;
    this.created_by_user = created_by_user;
    this.post_image = post_image;
    this.image_category = image_category;
    this.post_status = post_status;
    this.post_type = post_type;
  }

  async createPost() {
    const newPost = await post.create(this);
    if (newPost){
      NotificationService.pushNotiToSystem({
        type: NOTIFICATION_TYPES.CREATE_POST,
        senderId: this.created_by_user,
        receivedId: this.created_by_user,
      }).then(rs => console.log(rs))
    }

    return newPost;
  }
}

module.exports = PostService;
