const app = require("./src/app");
const { setupSocketServer } = require("./src/socket_handle");
const  PORT = 3055 

const  server = app.listen(PORT, '0.0.0.0' , ()=>{
   console.log(`API SOCIAL NETWORK start with  ${PORT}` )
})

setupSocketServer(server);

