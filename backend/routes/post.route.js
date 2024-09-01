import express from 'express';
import { protecRoute } from '../middleware/protecRoute.js';
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getUserPosts, likeUnlikePost } from '../controllers/post.controller.js';

const router = express.Router();

router.get("/all", protecRoute, getAllPosts);
router.get("/likes/:id", protecRoute, getLikedPosts);
router.get("/following", protecRoute, getFollowingPosts);
router.get("/user/:username", protecRoute, getUserPosts);
router.post("/create", protecRoute, createPost);
router.post("/like/:id", protecRoute, likeUnlikePost);
router.post("/comment/:id", protecRoute, commentOnPost);
router.delete("/:id", protecRoute, deletePost);

export default router;