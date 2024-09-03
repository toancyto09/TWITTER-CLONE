import express from 'express';
import { protecRoute } from '../middleware/protecRoute.js';
import { deleteNotification, deleteNotifications, getNotifications } from '../controllers/notification.controller.js';


const router = express.Router();

router.get("/", protecRoute, getNotifications);
router.delete("/", protecRoute, deleteNotifications);
router.delete("/:id", protecRoute, deleteNotification);

export default router;