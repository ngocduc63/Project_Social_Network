const  mongoose = require('mongoose');
const _SECONDS = 5000
const os = require('os')
const process = require('process')
//check Connect
const countConnect =()=>{
    const numConnections = mongoose.connections.length
    console.log(`Number of connections:: ${numConnections}`)
    return numConnections
} 
//check over load
const checkOverload =()=>{
    setInterval( ()=>{
        const numConnections = mongoose.connections.length
        const numCores = os.cpus().length
        const memoryUsage = process.memoryUsage().rss
        //Example maximum number of connections based on number of cores
        const maxConnections = numCores * 5
        console.log(`Number of connections:: ${numConnections}`)
       
        console.log(`Memory usage:: ${memoryUsage / 1024 / 1024} MB`);
        if (numConnections > maxConnections) {
            console.log(`Connection overload detected!`);
            //notify team or admin
          
        }
    },_SECONDS)
}


module.exports ={
    countConnect,checkOverload
    
}
