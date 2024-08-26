import express from 'express';
import { getMe, login, logout, signup } from '../controllers/auth.controller.js';
import { protecRoute } from '../middleware/protecRoute.js';
const router = express.Router();

router.post("/me", protecRoute, getMe);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;