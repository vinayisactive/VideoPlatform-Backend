import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const cookieOptions = { 
  //because of these two properites, now cookies can only be modified from server, not from frontend.
  httpOnly: true,
  secure: true,
};

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
  throw  new ApiError(500, "Failed to register user");
  
  return res
    .status(201)
    .json(new ApiResponse(200, registeredUser, "User registerd successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = await req.body;

  if (!email) throw new ApiError(400, "Provide credientials for login");

  const user = await User.findOne({ email: email }); //this user contains all the methods that we created in our Schema

  if (!user) throw new ApiError(404, "no user found");

  const checkPassword = await user.isPasswordCorrect(password); //accessing methods from the user object returned by database

  if (!checkPassword) throw new ApiError(401, "password is incorrect");

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(  
    user._id 
  );   //by now refreshToken is added, So user object is also updated.
  

  const loggedInUser = await User.findById(user._id).select(   
    "-password -refreshToken"
  );  //fetched the updated user object. 

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
      $set: {
        refreshToken: undefined,
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
  const incomingRefreshtoken = req.cookies?.refreshToken || req.body.refreshToken;

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
      throw new ApiError(401,  error?.message || "Invalid refresh token")
  }
});
