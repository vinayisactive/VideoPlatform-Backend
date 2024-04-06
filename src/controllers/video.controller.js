import Video from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const publishAVideo = asyncHandler(async (req, res) => {

    const user = req?.user._id;
    const {title, description } = req.body; 
    const videoFilePath = req.files?.videoFile[0].path;
    const thumbnailFilePath = req.files?.thumbnail[0].path;

    if (!user) 
    throw new ApiError(401, "Unauthorised user");

    if(!title || !description)
        throw new ApiError(400, "Provide title and description"); 

    if (!videoFilePath || !thumbnailFilePath) 
    throw new ApiError(400, "Provide video and thumbnail");

  const videoFileCloudinary = await uploadOnCloudinary(videoFilePath);
  if (!videoFileCloudinary) 
    throw new ApiError(500, "Filed to upload video");

  const thumbnailFileCloudinary = await uploadOnCloudinary(thumbnailFilePath);
  if (!thumbnailFileCloudinary)
    throw new ApiError(500, "Filed to upload thumbnail");

  const publishVideo = await Video.create({
    videoFile: videoFileCloudinary.url,
    thumbnail : thumbnailFileCloudinary.url,
    title: title, 
    description: description,
    duration: videoFileCloudinary.duration,
    owner : user
  });

  if(!publishVideo)
    throw new ApiError(500, "Failed to upload video"); 

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        publishVideo,
        "Video Published Successfully"
    )
  )
});

export const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    const userId = req?.user?._id;

    if(!userId)
      throw new ApiError(401, "Unauthorised User"); 

     if(!videoId)
      throw new ApiError(401, "Invalid video id"); 

      const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from : "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
                pipeline: [
                    {
                        $lookup:{
                            from: "subscriptions",
                            foreignField: "channel",
                            localField: "_id",
                            as: "Subscribers"
                        }
                     },
                     {
                        $lookup:{
                            from: "subscriptions",
                            foreignField: "subscriber",
                            localField: "_id",
                            as: "Subscribed"
                        }
                     },
                     {
                        $addFields: {
                            Subscribers:{
                                $size: "$Subscribers"
                            },
                            Subscribed: {
                                $size: "$Subscribed"
                            },
                            // isSubscribed: {
                            //   $cond: {
                            //     if: { $in: [userId, "$subscribers.subscriber"] }, 
                            //     then: true,
                            //     else: false
                            //   },
                            // },
                        }
                     },
                     {
                        $project: {
                            username: 1,
                            fullName: 1,
                            bio: 1,
                            Subscribers: 1,
                            Subscribed: 1,
                            // isSubscribed: 1
                        }
                     }
            ]
            }
        }
      ])

      if(!video)
        throw new ApiError(500, "No vidoe found"); 
 
     return res
     .status(200)
     .json( 
        new ApiResponse(
            200,
            video,
            "Video fetched Successfully"
        )
     )
})

export const updateVideoDetails = asyncHandler(async(req, res) => {

  const { title, description } = req.body 
  const { videoId } = req.params; 
  const userId = req?.user._id; 


  const videoDetails = await Video.findById(videoId); 
  if(!videoDetails)
  throw new ApiError(404, "Video doesn't exists");  

  if(videoDetails.owner?.toString() !== userId?.toString())
    throw new ApiError(400, "Unauthorised User to update the video details"); 


  let thumbnailFileCloudinary;
  if(req?.files && Array.isArray(req?.files.thumbnail) && req?.files?.thumbnail?.length > 0){
       const thumbnailPath = await req.files.thumbnail[0].path; 
    
      thumbnailFileCloudinary = await uploadOnCloudinary(thumbnailPath); 
      if(!thumbnailFileCloudinary.url)
        throw new ApiError(500, "Failed to upload thumbnail"); 
    }
  

  if(title) videoDetails.title = title; 
  if(description) videoDetails.description =  description; 
  if(thumbnailFileCloudinary?.url) videoDetails.thumbnail = thumbnailFileCloudinary.url; 


  const updatedVideoRefrence = await videoDetails.save({validateBeforeSave: false}); 
  if(!updatedVideoRefrence)
    throw new ApiError(401, "Failed to update video details"); 

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      updatedVideoRefrence,
      "Video details updated successfully"
    )
  ); 
})

export const deleteVideo = asyncHandler(async(req, res) => {
  const { videoId } = req.params;
  const userId = req?.user._id; 

  const videoDetails = await Video.findById(videoId); 
  if(!videoDetails)
    throw new ApiError(404, "Video doesn't exist"); 

  if(videoDetails.owner?.toString() !== userId.toString())
    throw new ApiError("500", "Unauthorised User to delete the video"); 

  const deletedVideoRefrence = await Video.findByIdAndDelete(videoId); 

  return res
  .status(200)
  .json(
    new ApiResponse(
      200, 
      deletedVideoRefrence,
      "Video deleted Successfully"
    )
  );

})

export const toggleVideoStatus = asyncHandler(async(req, res) => {
  const { videoId } = req.params; 
  const userId = req?.user._id; 

  const videoDetails = await Video.findById(videoId); 

  if(videoDetails.owner.toString() !== userId.toString())
    throw new ApiError(500, "Unauthorised User to toggle the video status"); 

  const status = videoDetails.isPublished === true ?  false : true;
  videoDetails.isPublished = status; 

  const updatedStatusRefrence = await videoDetails.save({validateBeforeSave: false}); 

  if(!updatedStatusRefrence)
    throw new ApiError(500, "Failed to update the video status"); 

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        isPublished: updatedStatusRefrence.isPublished
      },
      "Video status updated successfully"
    )
  ); 
  

})

