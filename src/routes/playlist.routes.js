import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deleteFromPlaylist, deletePlaylist, getPlaylistById, getUsersPlaylists, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router(); 
router.use(verifyJwtToken); 

router.route("/")
.post(createPlaylist)

router.route("/:playlistId")
.get(getPlaylistById)
.patch(updatePlaylist) 
.delete(deletePlaylist)

router.route("/add/:videoId/:playlistId")
.patch(addVideoToPlaylist); 

router.route("/del/:videoId/:playlistId")
.delete(deleteFromPlaylist)

router.route("/user/:userId")
.get(getUsersPlaylists)


export default router; 