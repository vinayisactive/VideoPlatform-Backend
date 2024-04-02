import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { Upload } from "../middlewares/multer.middleware.js";
import { getVideoById, publishAVideo } from "../controllers/video.controller.js";

const router= Router(); 

router.use(verifyJwtToken); 

router.route("/publish").post( 
    verifyJwtToken,
    Upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)

router.route("/:videoId").get(
    getVideoById
)

export default router