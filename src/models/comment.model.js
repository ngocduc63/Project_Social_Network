"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Comment"; // The name of the collection
const COLLECTION_NAME = "Comments"; // The name of the collection

// Declare the Schema of the Mongo model
var commentSchema = new Schema(
  {
    comment_postId: { type: Schema.Types.ObjectId, ref: "Post" },
    comment_userId: { type: Schema.Types.ObjectId, ref: "User" },
    comment_content: { type: String, default: "text" },
    comment_left: { type: Number, default: 0 },
    comment_right: { type: Number, default: 0 },
    commnet_parentId: { type: Schema.Types.ObjectId, ref: DOCUMENT_NAME },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, commentSchema);
