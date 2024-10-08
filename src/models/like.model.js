"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Like"; // The name of the collection
const COLLECTION_NAME = "Likes"; // The name of the collection

// Declare the Schema of the Mongo model
var likeSchema = new Schema(
  {
    like_postId: { type: Schema.Types.ObjectId, ref: "Post" },
    like_userId: { type: Schema.Types.ObjectId, ref: "User" },
    like_category: {
        type: String,
        enum: ["LIKE", "LOVE", "HAHA", "SAD", "ANGRY"],
        default: "LIKE",
      },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, likeSchema);
