const app = require("./src/app")
const  PORT = 3055 

const  server = app.listen(PORT, '0.0.0.0' , ()=>{
   console.log(`WSV eCommerce start with  ${PORT}` )
})

// process.on("SIGINT",()=>{
//     server.close(()=> console.log(`Exit server express`))
//     //  notify,send (ping...)
// })