import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//cookie options
const cookieOptions = {
  //because of these two properites, now cookies can only be modified from server, not from frontend.
  httpOnly: true,
  secure: true,
};

//function
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; //we set our generated refresh token.

    await user.save({ validateBeforeSave: false }); //to turn off the validation before saving user object with refresh token

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

//controllers
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password, bio } = req.body;

  if ([username, fullName, email, password].some((field) => field?.trim() === ""))
    throw new ApiError(400, "All credientials are required");

  const existingUser = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (existingUser)
    throw new ApiError(409, "User already exists with username and email");

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  if (!avatarLocalPath) 
   throw new ApiError(400, "Avatar is required");

  if (
    req?.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files?.coverImage?.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatarCloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);
  const coverImageCloudinaryResponse = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarCloudinaryResponse) 
    throw new ApiError(400, "Re-upload avatar");

  const registration = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    bio,
    avatar: avatarCloudinaryResponse.url,
    coverImage: coverImageCloudinaryResponse?.url || "",
    password,
  });

  const registeredUser = await User.findById(registration._id).select(
    "-password -refreshToken"
  );

  if (!registeredUser) 
    throw new ApiError(500, "Failed to register user");

  return res
    .status(201)
    .json(new ApiResponse(200, registeredUser, "User registerd successfully"));
});


export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = await req.body;

  if (!email) 
   throw new ApiError(400, "Provide credientials for login");

  const user = await User.findOne({ email: email }); //this user contains all the methods that we created in our Schema

  if (!user) 
   throw new ApiError(404, "no user found");

  const checkPassword = await user.isPasswordCorrect(password); //accessing methods from the user object returned by database

  if (!checkPassword) 
   throw new ApiError(401, "password is incorrect");

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  ); //by now refreshToken is added, So user object is also updated.

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); //fetched the updated user object.

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In successfully"
      )
    );
});


export const logoutUser = asyncHandler(async (req, res) => {
  const _id = req.user._id;

  await User.findByIdAndUpdate(
    _id,
    {
      $unset: {
        refreshToken: 1,  //this will set refreshToken to null
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "user logged out"));
});


export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshtoken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshtoken) 
    throw new ApiError(401, "Unauthorized request");

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedRefreshToken)
      throw new ApiError(401, "Unauthorized refresh token");

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingRefreshtoken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      decodedRefreshToken?._id
    );

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { refreshToken, accessToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});


export const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(200, {data: req.user}, "User details")
  )
}); 


export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  if (!oldPassword)
    throw new ApiError(400, "Provide old password");

  if(newPassword !== confPassword) 
    throw new ApiError(400, "confirm password should match new password"); 

  try {
    const user = await User.findById(req.user?._id);
  
    if (!user) 
     throw new ApiError(401, "Invalid user");
  
     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword); 
  
    if (!isPasswordCorrect) 
     throw new ApiError(400, "Old password is wrong");
  
    user.password = newPassword;
    const changePass = await user.save({ validateBeforeSave: false });
  
    if (!changePass) 
     throw new ApiError(401, "Something went wrong");
  
    return res
      .status(200)
      .json(
          new ApiResponse(200, {}, "Password changed successfully"));
      
  } catch (error) {
    throw new ApiError(401, error?.message || "something went wrong")
  }
});


export const updateUserDetails = asyncHandler(async(req, res) => {
  const {username, fullName, bio, email} = req.body; 

  try {
    const updatedDetails = await User.findByIdAndUpdate(
      req?.user._id,
      {
        ...(username && { username }),    // "...{username}" This expression spreads the properties of each individual object
        ...(fullName && { fullName }),      // { username: username, fullname:fullname, bio:bio, email:email } (object would look like this). 
        ...(bio && { bio }),
        ...(email && { email })
      },
      { new: true}
      ).select("-password -refreshToken"); 


     if(!updatedDetails)
      throw new ApiError(401, "something went wrong while saving"); 
  
      return res
      .status(200)
      .json(
        new ApiResponse(
          200, {updatedDetails}, "User details updated successfully"
        )
      )
  } catch (error) {
      throw new ApiError(401, error?.message || "something went wrong"); 
  }
}); 


export const updateUserImages = asyncHandler(async(req, res) => {
 try {
     let avatarPath; 
     let coverImagePath; 

     // if avatar is available
     let avatarCloudinaryResponse; 
      if(req?.files && Array.isArray(req?.files?.avatar) && req?.files?.avatar.length > 0){
        avatarPath = await req.files?.avatar[0].path;

        avatarCloudinaryResponse = await uploadOnCloudinary(avatarPath); 
        if(!avatarCloudinaryResponse?.url)
        throw new ApiError(400,"Failed to upload avatar")
      }

      // if coverImage is available
      let coverImageCloudinaryResponse; 
      if(req?.files && Array.isArray(req?.files?.coverImage) && req?.files?.coverImage.length > 0){
        coverImagePath = await req.files.coverImage[0].path; 
        coverImageCloudinaryResponse = await uploadOnCloudinary(coverImagePath); 

        if (!coverImageCloudinaryResponse?.url)
        throw new ApiError(400, "Failed to upload cover image");
      }

      const user = await User.findById(req?.user._id); 

      if(!user)
        throw new ApiError(401, "Invalid User"); 

      if(avatarPath && avatarCloudinaryResponse?.url ) user.avatar = avatarCloudinaryResponse?.url; 
      if(coverImagePath && coverImageCloudinaryResponse?.url) user.coverImage = coverImageCloudinaryResponse?.url; 

     await user.save({validateBeforeSave: false}); 

     return res
     .status(200)
     .json(
      new ApiResponse(
        200,
        {
          avatar : avatarCloudinaryResponse,
          coverImage : coverImageCloudinaryResponse
        },
        "User images updated"
      )
     )

 } catch (error) {
    throw new ApiError(401, error.message || "Something went wrong"); 
 }
}); 


export const getUserChannelDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) 
  throw new ApiError(400, "Username is missing");

try {
    const channel = await User.aggregate([
      { //matched the user in databse 
        $match: {
          username: username?.toLowerCase(),
        },
      },
      { //lookup for channel subscribers
        $lookup: { 
          from: "subscriptions", //cause of name conversion inside database 
          localField: "_id",
          foreignField: "channel", //for subscribers, we searching channel
          as: "subscribers",
        },
      },
      {  //lookup for subscribed channels
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber", //for subscribed by users
          as: "subscribedTo",
        },
      },
      { //addfields pipeline
        $addFields: {  //created/added fields inside user object
          subscribers: {
            $size: "$subscribers", //size returns the count of documents, and "$subscribers" cause its a filed now
          },
          subscribed: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req?.user._id, "$subscribers.subscriber"] }, //$in can search inside both array and objects
              then: true,
              else: false
            },
          },
        },
      },
      { //projection pipline
        $project: {    // Sent only these fields to user 
            username: 1,  // Set the value to 1 for each field to include it in the output.
            fullName: 1, 
            avatar: 1,
            coverImage: 1,
            bio: 1, 
            email: 1,
            createdAt: 1,
            subscribers: 1,
            subscribed: 1,
            isSubscribed: 1
        }
      }
    ]);
  
    if(!channel?.length)
      throw new ApiError(404, "Channel doesn't exists"); 

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel[0],    // Aggregation operations can return arrays containing single or multiple objects. In this   context, we're only interested in retrieving details for a single user channel, hence we return the first element of the array.
        "Channel Details"
      )
    ); 
  } catch (error) {
  throw new ApiError(401, error?.message || "User doesn't exists"); 
  }
});


export const getWatchedHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
      {
        $match:{
           // In aggregate operations, the "_id" field remains as string without being automatically converted to an ObjectId under the hood. To perform the conversion, Mongoose provide methods.
          _id: new mongoose.Types.ObjectId(req?.user._id)
        }
      },
      {
        $lookup: {            // Performing a left outer join with the "videos" collection to populate the watchHistory field that is inside user object.
          from: "videos",
          localField: "watchHistory",  
          foreignField: "_id",
          as: "watchHistory",        //Overriding "watchHistory" field itslef to add videos in it, instead of creating a new field inside user object.
  
         // This sub-pipeline enhances each "video" in watchHistory with information about its owner (cause owner inside videos isn't lookedup yet)    
          pipeline: [ 
            {
              $lookup: {        
                // Performing a left outer join with the "users" collection to populate the "owner" field inside each video
                from: "users",          
                localField: "owner",
                foreignField: "_id",
                as: "owner",               //Overriding "owner" field inside video object to add user  information. 
                
                //This $project stage is placed inside the sub-pipeline of the $lookup stage. This means that this sub-pipeline will be applied to the object retrieved from the "users" collection after the join, before they are embedded into the "owner" field of the video object.
                pipeline: [
                 {
                    $project: {            
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                   }
                 },
                 {  
                  // This additional pipeline stage replaces the "owner" array field (Inside each video cause aggregate operations returns array of object) with the first element/object of the owner array ( frontend convenient)
                  $addFields: {  
                    owner: {   //overriding owner array field with Owner array first element 
                      $first: "$owner" //$first for first element of array

                    }
                  }
                }]
              }
            }
          ]
        }
      }
    ])

    if(!user) 
      throw new ApiError(401, "something went wrong")

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    )
})