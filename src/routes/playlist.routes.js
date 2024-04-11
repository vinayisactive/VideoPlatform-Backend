import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router(); 
router.use(verifyJwtToken); 

router.route("/")
.post(createPlaylist)
.get(getUserPlaylists)


router.route("/:playlistId")
.get(getPlaylistById)
.patch(updatePlaylist)
.delete(deletePlaylist)

router.route("/add/:videoId/:playlistId")
.patch()

export default router; 