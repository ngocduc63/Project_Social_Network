"use strict";
const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Story"; // The name of the collection
const COLLECTION_NAME = "Storys"; // The name of the collection

var storySchema = new Schema(
  {
    story_title: {
      type: String,
      trim: true,
    },
    created_by_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    story_image: {
      type: String,
      default: "",
    },
    story_video: {
      type: String,
      default: "",
    },
    reactions: {
      type: Array,
      default: [],
    },
    story_status: {
      type: String,
      enum: ["PUBLIC", "PRIVATE", "FRIEND"],
      default: "PUBLIC",
    },
    story_watched: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, storySchema);
