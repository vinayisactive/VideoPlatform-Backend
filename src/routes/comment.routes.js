import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { addComment, getComments } from "../controllers/comment.controller.js";

const router = Router(); 
router.use(verifyJwtToken); 
 
router.route("/:videoId")
.post(addComment)
.get(getComments)

export default router; 