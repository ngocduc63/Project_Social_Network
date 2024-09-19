"use strict";
const StatusCode = {
  CREATED: 201,
  OK: 200,
};

const ReasonStatusCode = {
  CREATED: "created",
  OK: "Success",
};

class SuccessResponse {
  constructor(
    metadata = {},
    message = '',
    statusCode = StatusCode.OK,
    reasonStatusCode = ReasonStatusCode.OK
  ) {
    this.message = message === '' ? reasonStatusCode : message;
    this.status = statusCode;
    this.metadata = metadata;
  }
  send(res, headers = {}) {
    return res.status(this.status).json(this);
  }
}

class OK extends SuccessResponse {
  constructor(metadata, message) {
    super(metadata, message);
  }
}

class CREATED extends SuccessResponse {
  constructor({
    metadata,
    message,
    statusCode = StatusCode.CREATED,
    reasonStatusCode = ReasonStatusCode.CREATED,
    options = {},
  }) {
    super(metadata, message, statusCode, reasonStatusCode);
    this.options = options;
  }
}

module.exports = {
  OK,
  CREATED,
  SuccessResponse,
};
