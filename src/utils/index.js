"use strict";
const _ = require("lodash");
const { ObjectId } = require("mongodb");
const path = require("path");
const { google } = require("googleapis");
const apikeys = {
  type: "service_account",
  project_id: "project-social-network-440713",
  private_key_id: "68e8b8ca2dd91d4d028317cabf1e221f35cce115",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDl/dKOB6MRXDIY\nofuR6XhH32idmGSB0Ze7vkZWFBSsX9JGCGsNxtL7ytkSZo+GtrkdGS3W1u1eu82t\nL9aOyg02Q+p1mIerSk2Z26obD923/SLOWN0U9/SjHF0na5md7zYtaGYHjDcZY2O4\nEPpwxAwLzgAG6AdPXM+E4ExQ13qEAKvusjhBDOSHYLfTmBcvWpyOQE+KPQJGNQ5e\nyUELlkaTraIBXRiE9D7gvT2NX5RSG1MvrQg8eqppPZZ/yC8RMl41bkzjN+bGkQKp\noG3Lie0Y+9wBVkR2P8lowS1jxTcxhu0aCBkELgHnIOWjqRctoMzI90flxeCtUjI4\n6oHLg1yhAgMBAAECggEAIdzLj8RhlsiBir1sxhi/MCvdYhjCMZf7tHWJMxrNSWzp\nT4zlQDfGMDL3X31ww+eq3TUsGd32wJQ7rfRlbYwjwlnhDzPoQ8jSoKTmSIo/PZv8\ncC/Gy1PPteVS9N8jlMyX6DsfDJzxLuCCmeMMEKbY1DMeL2Yhz2ZNmpWQvvVe8UjF\njuP8tKL3cv3kWI8WdjshIdnVZVhqRD+ts7Sk7Grv6mB1M9ZkGASjn8jrCkvJPBXP\nZdxlvUpENrVG6t1u4jnJ3bwOPmO+fkn0PzukidU3Cldu4cOiggsYEgMtwUn8AOK8\n7eSS1J4nN/1dKImHK8+A4FCpG3GFgJ2eFrX1pRAcnQKBgQD4XDfksYBAv2VftCQe\nfsSGzpM2X4q1mL7ewWuYSnHRW5gefRw+64AcOUfmhiLdvVR04FDajJr9j4OXsc45\nQu4DNQ7a37Bh0QAqSmHUoZATC1LKpsXd2U0AT0v8GJkPLcla76p8q6x6lasnD6mY\nENRoMJJu8Ehyst1c4XssENuhhQKBgQDtEPRWgJn5yahO0Y3uWQGoH/8LbrZsC64F\nV2HfxvaC6e2pqOO5EZkFt8seLk0nmtFmx1Yxcwn8Fa3hfAwghAX3Z7YgvtlFDzxK\nlniG9vN0YwKK9T5Qj7vDyKwY2mytcLOllRdl911g3yM3m0TjaK83t49KtLm3EP9e\n2p7f9ZlrbQKBgQDfIvNwu+0vvwYUWyPMZjapq3Vl96cHCuoJ9pt1owTphTKBygQT\nn8BlGy23NrKiqFT2AQeDo6oov8UKCEzw82omZYgoK6sr5vwQAu4sfM+V3KmQuw+x\nB2gALD5ni64QjiGHWybAhfkb1daE7LSBlDVSOrmFhMqCiqMJrOfeKnM5hQKBgQCC\ndgwg9pDF+AYZqhTzkCPrRAB1aC4X862G3vnLzpCmptnVvk3j8R1HGkg7ibuIChkm\n+Jgkimx6P+v65Os/kag+6OI/zwd+i83gNkKJ86ky6bHiiugKKa9pJSwgWUPphtY2\nT4Aa6zCGOQYGefpFM70Jaoj+0cpKRp5isukv0tblWQKBgQCRe03GwnJRrCwsy5Og\nRfLSibR0O5mz2aZOcCwgn94AnWRmmDZkHKykbxRP5vqoZs9UrUxeUFzRNfUT7qz4\nfk9Rxp3+HMBbcY209Xxx90aYXgE42QSe7IUqhxfjNaJNRPZXxPsQvaJnHaipb/jm\nwEAY6spTyJS+xZVnh/mPUi9PIg==\n-----END PRIVATE KEY-----\n",
  client_email:
    "admin-8386@project-social-network-440713.iam.gserviceaccount.com",
  client_id: "101324231086923363353",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/admin-8386%40project-social-network-440713.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const { Readable } = require("stream");
const SCOPE = ["https://www.googleapis.com/auth/drive"];

const convertToObjectIdMongodb = (id) => ObjectId.createFromHexString(id);

const encodePathFile = (pathFile) =>
  encodeURIComponent(path.relative("uploads", pathFile));
const decodePathFile = (fileName) => decodeURIComponent(fileName);

async function authorizeGGDrive() {
  const jwtClient = new google.auth.JWT(
    apikeys.client_email,
    null,
    apikeys.private_key,
    SCOPE
  );
  await jwtClient.authorize();
  return jwtClient;
}

const uploadFileToGGDrive = async (file) => {
  try {
    const auth = await authorizeGGDrive();
    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
      parents: ["1qHIoS--lTBTwBc-9k02mbTZ5BIwOLFXH"],
    };

    const bufferStream = new Readable();
    bufferStream._read = () => {};
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    const fileId = await response.data.id;
    return fileId;
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
  }
};

const getFileGGDriveById = async (fileId) => {
  const auth = await authorizeGGDrive();
  const drive = google.drive({ version: "v3", auth });
  const fileResponse = await drive.files.get(
    {
      fileId: fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  return fileResponse;
};

const getInfoData = ({ fileds = [], object = {} }) => {
  return _.pick(object, fileds);
};

module.exports = {
  getInfoData,
  convertToObjectIdMongodb,
  encodePathFile,
  decodePathFile,
  uploadFileToGGDrive,
  getFileGGDriveById,
};
