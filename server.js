const app = require("./src/app")
const  PORT = 3055 

const  server = app.listen(PORT, '0.0.0.0' , ()=>{
   console.log(`API SOCIAL NETWORK start with  ${PORT}` )
})

app.get("/", (req, res) => res.send("Deploy sucesss"));

// process.on("SIGINT",()=>{
//     server.close(()=> console.log(`Exit server express`))
//     //  notify,send (ping...)
// })

const callApiEveryMinute = () => {
   axios.get(`https://0.0.0.0:${PORT}/`)
       .then(response => {
           console.log("API called successfully:", response.data);
       })
       .catch(error => {
           console.error("Error calling API:", error.message);
       });
};

setInterval(callApiEveryMinute, 60000);