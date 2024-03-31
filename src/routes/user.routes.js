import { Router } from "express";
import { 
    getCurrentUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateUserDetails, 
    changeCurrentPassword, 
    updateUserImages, 
    getUserChannelDetails, 
    getWatchedHistory
 } from "../controllers/user.controller.js";
import { Upload } from "../middlewares/multer.middleware.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const router = Router(); 

router.route("/register").post(
    Upload.fields([
        { 
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    ,registerUser);

router.route("/login").post(loginUser); 

//secured routes
router.route("/logout").post(verifyJwtToken, logoutUser); 
router.route("/refresh-token").post(refreshAccessToken); 
router.route("/update-details").patch(verifyJwtToken, updateUserDetails);
router.route("/change-password").patch(verifyJwtToken, changeCurrentPassword);
router.route("/get-user").get(verifyJwtToken, getCurrentUser); 

router.route("/image-update").patch(
    verifyJwtToken,
    Upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), 
    updateUserImages
)

router.route("/channel/:username").get(verifyJwtToken, getUserChannelDetails);
router.route("/watched").get(verifyJwtToken, getWatchedHistory);

export default router; 