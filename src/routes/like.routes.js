import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { getLikedVideosByUser, toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router(); 
router.use(verifyJwtToken); 

router.route("/toggle/v/:videoId")
.post(toggleVideoLike)

router.route("/toggle/c/:commentId")
.post(toggleCommentLike); 

router.route("/user")
.get(getLikedVideosByUser);

export default router;