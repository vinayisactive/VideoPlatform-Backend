import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Subscription from "../models/subscription.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const toggleSubscription = asyncHandler(async(req, res) => {
    const { channelId } = req.params;  
    const userId = req?.user._id; 
    let isSubscribed; 
    
    const userSubscribedDetails = await Subscription.findOne(
        {
          subscriber: userId,
          channel: channelId
        }); 

        
    if(userSubscribedDetails){
        await Subscription.findByIdAndDelete(userSubscribedDetails?._id); 
        isSubscribed = false; 
    }else{
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        })

        isSubscribed = true; 
    }

    const updatedUserSubscribedDetails = await Subscription.findOne(
        {
            subscriber: userId,
          channel: channelId
        }); 


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                UserSubscriptionDetails : updatedUserSubscribedDetails,
                isSubscribed
            },
            isSubscribed === true ? "Subscribed Channel" : "Not Subscribed Channel"
        ),
    )
}); 

export const getUserChannelSubscriptions = asyncHandler(async(req, res) => {
    const { channelId } = req.params; 

     const userChannelSubscribers = await Subscription.find({
        channel: channelId
     }); 

     const channelSubscribedbyUserChannel = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline:[
                    {
                        $project: {
                            username: 1,
                            fullName: 1, 
                        }
                    },
                ]
            }
        },
        {
                $addFields : {
                    subscribedTo : {
                         $arrayElemAt: ["$subscribedTo", 0] 
                    }
                }
        },
        {
            $project:{
                subscribedTo: 1
            }
        }
     ]); 

     return res
     .status(200)
     .json(
        new ApiResponse(
            200,
            { 
                "subscribers" : userChannelSubscribers?.length,
                "subscribed" : channelSubscribedbyUserChannel
            },
            "Channel Subscription details"
        )
     )
})


