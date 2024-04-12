import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Like from "../models/like.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import Video from "../models/video.model.js";

export const toggleVideoLike = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    const userId = req?.user._id; 

    let isLiked;
    let updatedVideoLikeRefrence; 

    if(!videoId)
        throw new ApiError(401, "videoId is missing"); 

    const video = await Video.findById(videoId); 
    if(!video)
        throw new ApiError(500, "Video doesn't exists"); 

    const ifAlreadyLiked = await Like.findOne(
      {
        likedBy : userId, 
        video: videoId
      }
    ); 

    if(ifAlreadyLiked){
        updatedVideoLikeRefrence = await Like.findByIdAndDelete(ifAlreadyLiked?._id); 
        if(!updatedVideoLikeRefrence)
            throw new ApiError(500, "Failed to unlike");

        isLiked = false
    }else{
         updatedVideoLikeRefrence = await Like.create({
            video: videoId,
            likedBy: userId
        }); 

        if(!updatedVideoLikeRefrence)
            throw new ApiError(500, "Failed to like video"); 

        isLiked = true;
    }

   let likeCount = await Like.find({video: videoId});  
   if(!likeCount){
    likeCount = 0 
    }else{
        likeCount = likeCount?.length; 
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                updatedVideoLikeRefrence,
                isLiked: isLiked,
                totalLikes: likeCount
            },
            isLiked === true ? "Video liked successfully" : "Video unliked successfully"
        )
    ); 
}); 


export const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params; 
    const userId = req?.user._id; 

    let isLiked; 
    let updatedCommentLikeRefrence; 

    if(!commentId)
        throw new ApiError(401, "commentId is missing"); 

    if(!userId)
        throw new ApiError(401, "Unauthorised user")

    const isAlreadyLiked = await Like.findOne(
        {
            likedBy: userId,
            comment : commentId
        }
    ); 

    if(isAlreadyLiked){
        updatedCommentLikeRefrence = await Like.findByIdAndDelete(isAlreadyLiked?._id); 
        if(!updatedCommentLikeRefrence)
            throw new ApiError(500, "Failed to unlike commet"); 

        isLiked = false; 
    }else{
        updatedCommentLikeRefrence = await Like.create(
            {
                comment: commentId,
                likedBy: userId
            }
        ); 

        if(!updatedCommentLikeRefrence)
            throw new ApiError(500, "Failed to like comment"); 
        
        isLiked = true; 
    }


    let likeCount = await Like.find({
        comment: commentId
    }); 

    if(!likeCount){
        likeCount = 0
    }else{
        likeCount = likeCount?.length;
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            {
                updatedCommentLikeRefrence,
                likeCount: likeCount,
                isLiked: isLiked
            },
            isLiked === true ? "Comment liked successfully" : "Comment unliked Successfully"
        )
    ); 
})