'use strict';
const StatusCode = {
    FORBIDDEN : 403,
    CONFLICT : 409,
    NOT_FOUND: 406,
    JWT_EXPRIED : 407
}

const ReasonStatusCode = {
    FORBIDDEN : 'Bad request error',
    CONFLICT : 'Conflict error',
    JWT_EXPRIED : "Expired token"
} 

const {
    StatusCodes,
    ReasonPhrases
} = require('../utils/httpStatusCode')

class ErrorResponse extends Error {
    constructor(message, status ) {
        super(message)
        this.status = status
    }
}

class ConflictError extends ErrorResponse {
    constructor(message = ReasonStatusCode.CONFLICT, statusCode = StatusCode.FORBIDDEN) {
        super(message, statusCode)
    }
}

class JwtExpriedError extends ErrorResponse {
    constructor(message = ReasonStatusCode.JWT_EXPRIED, statusCode = StatusCode.JWT_EXPRIED) {
        super(message, statusCode)
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = ReasonStatusCode.CONFLICT, statusCode = StatusCode.FORBIDDEN) {
        super(message, statusCode)
    }
}

class AuthFailureError extends ErrorResponse {
    constructor(message = ReasonPhrases.UNAUTHORIZED, statusCode = StatusCode.UNAUTHORIZED) {
        super(message, statusCode)
    }
}

class NotFoundError extends ErrorResponse {
    constructor(message = ReasonPhrases.NOT_FOUND, statusCode = StatusCode.NOT_FOUND) {
        super(message, statusCode)
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(message = ReasonPhrases.FORBIDDEN, statusCode = StatusCode.FORBIDDEN) {
        super(message, statusCode)
    }
}


module.exports = { ConflictError, BadRequestError,AuthFailureError,NotFoundError, ForbiddenError, JwtExpriedError}