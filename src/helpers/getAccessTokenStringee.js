const CommonService = require("../services/common.service");

const apiKeySid = "SK.0.dG0uPXwjDQ5hgjqlz582WjhTkXYkJ0h";
const apiKeySecret = "UUVNU21LZkVmNjB0QTdRd1UzTE5vdmtJMWU3R1JYcE4=";
// const userId = 'YOUR_USER_ID';

// var token = getAccessToken();
// console.log(token);

const  getAccessTokenStringee = async (keyStore) => {
    const userId = await CommonService.getUserIdByKeyStore(keyStore);

  var now = Math.floor(Date.now() / 1000);
  var exp = now + 3600;

  var header = { cty: "stringee-api;v=1" };
  var payload = {
    jti: apiKeySid + "-" + now,
    iss: apiKeySid,
    exp: exp,
    userId: userId,
  };

  var jwt = require("jsonwebtoken");
  var token = jwt.sign(payload, apiKeySecret, {
    algorithm: "HS256",
    header: header,
  });

  return token;
}

module.exports = { getAccessTokenStringee };
