"use strict";

const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { allowedImageTypes, allowedVideoTypes } = require("../utils/const.common");

const uploadFileHandler = () => {
  // SET STORAGE
  // set upload local
  // const storage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     const userId = req.keyStore.user.toString();
  //     const uploadPath = path.join("uploads", userId);

  //     // Kiểm tra nếu thư mục tồn tại, nếu không thì tạo mới
  //     if (!fs.existsSync(uploadPath)) {
  //       fs.mkdirSync(uploadPath, { recursive: true }); // Tạo thư mục nếu chưa có (recursive: true để tạo các thư mục cha nếu cần)
  //     }

  //     cb(null, uploadPath);
  //   },

  //   filename: (req, file, cb) => {
  //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  //     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); 
  //   }
  // });

  const storage = multer.memoryStorage();
  
  // Kiểm tra định dạng file
  const fileFilter = (req, file, cb) => {
    if (allowedImageTypes.includes(file.mimetype)) {
        // Nếu là file ảnh
        cb(null, { type: 'image', file: file });
    } else if (allowedVideoTypes.includes(file.mimetype)) {
        // Nếu là file video
        cb(null, { type: 'video', file: file });
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and video files are allowed!"), false);
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: (req, file) => {
            if (file.mimetype.startsWith('image/')) {
                return 1024 * 1024 * 5; // Giới hạn cho ảnh (5MB)
            } else if (file.mimetype.startsWith('video/')) {
                return 1024 * 1024 * 20; // Giới hạn cho video (20MB)
            }
            return 1024 * 1024 * 5; 
        },
    },
  })

  return upload;
};

module.exports = {
  uploadFileHandler,
};
