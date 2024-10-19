"use strict";

const multer = require("multer");
const fs = require('fs');
const path = require('path');

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

    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now());
    },
  });

  const upload = multer({ storage: storage });

  return upload;
};

module.exports = {
  uploadFileHandler,
};
