"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Post"; // The name of the collection
const COLLECTION_NAME = "Posts"; // The name of the collection

// category for save image: 0:normal, 1: avatar, 2: cover
// status: 0:private, 1:public, 2: friend
// type_post: 0: normal, (post share) !0: post_id
var postSchema = new Schema(
  {
    post_title: {
      type: String,
      trim: true,
    },
    created_by_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post_image: {
      type: Array,
      default: [],
    },
    image_category: {
      type: String,
      enum: ["NORMAL", "AVATAR", "COVER"],
      default: "NORMAL",
    },
    post_status: {
      type: String,
      enum: ["PUBLIC", "PRIVATE", "FRIEND"],
      default: "PUBLIC",
    },
    post_num_comment: {
      type: Number,
      default: 0
    },
    post_num_like: {
      type: Number,
      default: 0
    },
    post_num_share: {
      type: Number,
      default: 0
    },
    post_type: {
      type: Schema.Types.ObjectId,
      ref: DOCUMENT_NAME,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, postSchema);
