import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { getUserChannelSubscriptions, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router(); 

router.use(verifyJwtToken); 

router.route("/channel/:channelId")
.post(toggleSubscription)
.get(getUserChannelSubscriptions); 



export default router; 