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
    if(!playlists)
    throw new ApiError(404, "No playlist found"); 

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

//endpoints which need playlistId
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
        throw new ApiError(404, "No playlist found"); 

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

export const updatePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params; 
    const { name, description } = req.body; 
    const userId = req?.user._id; 
    
    if(!playlistId)
    throw new ApiError(404, "Playlist id not found"); 

    const playlist = await Playlist.findById(playlistId); 
    if(!playlist)
    throw new ApiError(500, "No playlist found"); 

    if(playlist.owner.toString() !== userId.toString())
        throw new ApiError(500, "Unauthorised user to update playlist"); 

    if(name) playlist.name = name; 
    if(description) playlist.description = description; 

    const updatedPlaylistRefrence = await playlist.save({validateBeforeSave: false}); 
    if(!updatedPlaylistRefrence)
        throw new ApiError(500, "Failed to update playlist"); 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            updatedPlaylistRefrence,
            "Playlist updated Successfully"
        )
    );
})

export const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params; 
    const userId = req?.user._id; 
        
    if(!playlistId)
       throw new ApiError(404, "Playlist id not found"); 

    const playlist = await Playlist.findById(playlistId); 
    if(!playlist)
        throw new ApiError(404, "No playlist found"); 

    if(playlist.owner.toString() !== userId.toString())
       throw new ApiError(500, "Unauthorised user to delete playlist");

    const deletedPlaylistRefrence = await Playlist.findByIdAndDelete(playlistId); 
    if(!deletedPlaylistRefrence)
        throw new ApiError(500, "Failed to delete playlist, try again"); 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedPlaylistRefrence,
            "Playlist deleted successfully"
        )
    );
})







