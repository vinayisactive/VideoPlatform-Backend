import { Commet } from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from '../utils/ApiResponse.js'
import mongoose, { mongo } from "mongoose";

export const addComment = asyncHandler(async(req, res) => {
    const { videoId } = req.params; 
    const { content } = req.body
    const userId = req?.user._id

    if(!content)
        throw new ApiError(400, "Provide comment content")

    if(!userId)
        throw new ApiError(403, "Unauthorised User"); 

    if(!videoId)
      throw new ApiError(404, "Video not found"); 

    const createComment = await Commet.create({
        content: content, 
        video: videoId, 
        owner: userId
    }); 

    if(!createComment)
        throw new ApiError(500, "Failed to comment, try again"); 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                createComment
            },
            "User Commented successfully"
        )
    )
}); 

export const getComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params; 

    if(!videoId)
        throw new ApiError(404, "Video not found");

    const comments = await Commet.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField:"_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    },
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $arrayElemAt: ["$owner", 0] 
                }
            }
        }
    ]); 

    if(!comments)
        throw new ApiError(500, "Failed to fetch comments"); 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "comments fetched successfully"
        )
    )
})

export const updateComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params; 
    const { content } = req.body; 
    const userId = req?.user._id; 
    
    if(!commentId)
        throw new ApiError(404, "No comment found"); 

    if(!content)
        throw new ApiError(401, "Provide comment content"); 

    const getComment = await Commet.findById(commentId); 

    if(getComment.owner.toString() !== userId.toString())
        throw new ApiError(500, "Unauthorised user to update the comment"); 

    getComment.content = content; 
    const updatedCommentRefrence = await getComment.save({validateBeforeSave: false}); 

    if(!updatedCommentRefrence)
        throw new ApiError(500, "Failed to update comment"); 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedCommentRefrence,
            "Comment updated successfully"      
        )
    ); 
})

