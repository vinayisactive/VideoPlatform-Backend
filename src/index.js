import { app } from "./app.js";
import connectDataBase from "./database/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: "./env"
}); 

connectDataBase() 
.then(() =>{
    app.listen(process.env.PORT ||  3000, () => {
        console.log(`Server is running at : ${process.env.PORT}`);
    }); 

    app.on("error", (error) => {
        console.log(`Error in starting server : ${error}`)
    })
})
.catch((error) => {
    console.log(`Mongodb connection error : ${error}`)
  })
