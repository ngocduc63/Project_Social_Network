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

const callApiEveryMinute = () => {
   axios.get(`https://0.0.0.0:${PORT}/api/user/image/avt_default_male`)
       .then(() => {
           console.log("API called successfully");
       })
       .catch(error => {
           console.error("Error calling API:", error.message);
       });
};

setInterval(callApiEveryMinute, 100);