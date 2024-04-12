import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router(); 
router.use(verifyJwtToken); 

router.route("/toggle/v/:videoId")
.post(toggleVideoLike)

router.route("/toggle/c/:commentId")
.post(toggleCommentLike); 

export default router;