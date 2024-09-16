const mongoose = require('mongoose')

const connectString = `mongodb://localhost:27017/webFacebook`

 mongoose.connect( connectString).then( _=> console.log(`Connected Mongodb Success`))
.catch(err => console.log(`Connected Mongodb Fail`));
//dev
 if(1 === 1){
    mongoose.set('debug', true)
    mongoose.set('debug', { color: true})
 }

 module.exports = mongoose