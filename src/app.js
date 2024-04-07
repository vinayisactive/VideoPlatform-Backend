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



import userRouter from './routes/user.routes.js'
app.use("/api/v1/users", userRouter);

import videoRouter from './routes/video.routes.js'
app.use("/api/v1/videos", videoRouter); 

import subscriptionRouter from './routes/subscription.routes.js'
app.use("/api/v1/subscription", subscriptionRouter); 

import commentRouter from './routes/comment.routes.js'
app.use("/api/v1/comments", commentRouter); 

import playlistRouter from './routes/playlist.routes.js'
app.use("/api/v1/playlists", playlistRouter); 