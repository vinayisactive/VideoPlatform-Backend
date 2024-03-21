import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserDetails, changeCurrentPassword, updateUserImages } from "../controllers/user.controller.js";
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
router.route("/update-details").post(verifyJwtToken, updateUserDetails)
router.route("/change-password").post(verifyJwtToken, changeCurrentPassword)
router.route("/get-user").post(verifyJwtToken, getCurrentUser); 

router.route("/image-update").post(
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
    verifyJwtToken,
    updateUserImages
)

export default router; 