import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => { 
  const { username, email, fullName, password, bio} = req.body;

  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All credientials are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with username and email");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath; 

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  if( req?.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length >0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatarCloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);
  const coverImageCloudinaryResponse= await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarCloudinaryResponse) {
    throw new ApiError(400, "Re-upload avatar");
  }


  const registration = await User.create({
    username : username.toLowerCase(),
    fullName,
    email,
    bio,
    avatar: avatarCloudinaryResponse.url,
    coverImage : coverImageCloudinaryResponse?.url || "", 
    password,
  });


  const registeredUser = await User.findById(registration._id).select(
    "-password -refreshToken"
  ); 

  if(!registeredUser){
    new ApiError(500, "Failed to register user")
  }

  return res.status(201).json(
        new ApiResponse(
            200,
            registeredUser,
            "User registerd successfully"
        )
  )
});
