"user strict";

const post = require("../models/post.model");

class PostService {
  static async createPost(body) {
    return new Post(body).createPost();
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
    return await post.create(this);
  }
}

module.exports = PostService;
