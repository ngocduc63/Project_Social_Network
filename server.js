const app = require("./src/app")
const axios = require("axios");
const  PORT = 3055 

const  server = app.listen(PORT, '0.0.0.0' , ()=>{
   console.log(`API SOCIAL NETWORK start with  ${PORT}` )
})

// process.on("SIGINT",()=>{
//     server.close(()=> console.log(`Exit server express`))
//     //  notify,send (ping...)
// })
