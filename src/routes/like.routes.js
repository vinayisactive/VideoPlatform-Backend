import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { toggleVideoLike } from "../controllers/like.controller.js";

const router = Router(); 
router.use(verifyJwtToken); 

router.route("/toggle/v/:videoId")
.post(toggleVideoLike)

export default router;