import connectDataBase from "./database/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: "./env"
}); 

connectDataBase();     