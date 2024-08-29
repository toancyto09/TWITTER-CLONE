import express from "express";
import { protecRoute } from "../middleware/protecRoute.js";
import { followUnfollowUser, getSuggestedUsers, getUserProfile, updateUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protecRoute, getUserProfile);
router.get("/suggested", protecRoute, getSuggestedUsers);
router.post("/follow/:id", protecRoute, followUnfollowUser);
router.post("/update", protecRoute, updateUserProfile);

export default router;