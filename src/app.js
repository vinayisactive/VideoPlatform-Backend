import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

export const app = express();  

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
})); 

app.use(cookieParser());

app.use(express.json({limit: "12kb"})); 

app.use(express.urlencoded({extended:true, limit:"12kb"})); 

app.use(express.static("public"));


