import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


export const createPlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body; 
    const userId = req?.user._id;  

    if(!name)
    throw new ApiError(400, "Provide playlist name");  

    if(!userId)
    throw new ApiError(401, "Unauthorised User"); 

    const playlist = await Playlist.create({
        name,  
        description : description || "a playlsit", 
        owner: userId
    }); 

    if(!playlist)
    throw new ApiError(500, "Failed to create playlist"); 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist, 
            "Playlist created successfully"
        )
    )

})

export const getUserPlaylists = asyncHandler(async(req, res) => {
    const userId = req?.user._id; 

    const playlists = await Playlist.find({owner: userId}); 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "All Playlists fetched"
        )
    )
}); 

export const getPlaylistById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params
     
    if(!playlistId)
    throw new ApiError(404, "Playlist id isn't available"); 

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        }, 
        {
            $lookup:{
                from : "users", 
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName:1,
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            thumbnail:1,
                            description:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $arrayElemAt:  ["$owner", 0] 
                },
                videos:{
                    $arrayElemAt: ["$videos", 0]
                }
            }
        }
    ]); 

    if(!playlist)
    throw new ApiError(500, "Failed to fetch playlist")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    ); 
})



