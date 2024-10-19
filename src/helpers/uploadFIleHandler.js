"use strict";

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadFileHandler = () => {
  // SET STORAGE
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const userId = req.keyStore.user.toString();
      const uploadPath = path.join("uploads", userId);

      // Kiểm tra nếu thư mục tồn tại, nếu không thì tạo mới
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true }); // Tạo thư mục nếu chưa có (recursive: true để tạo các thư mục cha nếu cần)
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); 
    }
  });

  // Kiểm tra định dạng file
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only JPEG, PNG and GIF are allowed!"),
        false
      );
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 1024 * 1024 * 5, // Giới hạn kích thước ảnh (5MB)
    },
  });

  return upload;
};

module.exports = {
  uploadFileHandler,
};
