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
        const updatedVideoLikeRefrence = await Like.findByIdAndDelete(ifAlreadyLiked?._id); 
        if(!updatedVideoLikeRefrence)
            throw new ApiError(500, "Failed to unlike");

        isLiked = false
    }else{
        const updatedVideoLikeRefrence = await Like.create({
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