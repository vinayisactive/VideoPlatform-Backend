import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { addComment, getComments, updateComment } from "../controllers/comment.controller.js";

const router = Router(); 
router.use(verifyJwtToken); 
 
router.route("/:videoId")
.post(addComment)
.get(getComments)


router.route("/c/:commentId")
.patch(updateComment)
.delete()


export default router; 