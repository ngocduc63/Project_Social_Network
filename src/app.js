require('dotenv').config();

const compression = require('compression');
const express   = require('express');
const morgan = require('morgan');
const { default: helmet } = require('helmet')
const app = express()

//init middleware
app.use(morgan("dev"))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//  app.use(morgan("combined"))
//  app.use(morgan("common"))
//   app.use(morgan("short"))
//   app.use(morgan("tiny"))

//init db
require('./dbs/init.mongodb')
// const { checkOverload} =require ('./helpers/check.connect')
// checkOverload()

//init routes
app.use('/', require('./routers'))

//handling errors
app.use((req, res, next) => {
  const  error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use((error, req, res, next) => {
  const  statusCode = error.status || 500
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error'
  }) 

})


module.exports = app
