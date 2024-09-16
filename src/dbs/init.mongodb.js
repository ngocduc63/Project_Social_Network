const mongoose = require('mongoose')


// console.log(require('../configs/congif.mongdb'));

const {db: {host,name,port}} = require('../configs/congif.mongdb')

const connectString = `mongodb://${host}:${port}/${name}`

// const connectString = `mongodb://localhost:27017/webFacebook`
const { countConnect } =require ('../helpers/check.connect')


class Database{
    constructor(){
        this.connect()
    }
    //connect
    connect(type='mongodb') {
        if(1 === 1){
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true})
         }
        
         module.exports = mongoose
        mongoose.connect( connectString,{
            maxPoolSize: 50
        }).then( _=> {
            console.log(`Connected Mongodb Success Pro`,countConnect())
        })
        .catch(err => console.log(`Connected Mongodb Fail`)); 

    }
    static getInstance(){
        if(!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb