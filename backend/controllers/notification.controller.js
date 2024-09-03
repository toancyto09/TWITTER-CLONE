import Notification from "../models/notification.model.js";


export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg"
    });

    await Notification.updateMany({ to: userId }, { read: true });

    return res.status(200).json(notifications);
  } catch (error) {
    console.log("Error is getNotifications", error.message);
    return res.status(500).json({ error: "Interval Server Erorr" });
  }
}

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications delete successfully" });
  } catch (error) {
    console.log("Error is deleteNotifications", error.message);
    return res.status(500).json({ error: "Interval Server Erorr" });
  }
}

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(400).json({ error: "Notification not found" });
    }

    if (notification.to.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You are not allowed to delete this notification" });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({ message: "Notification delete successfully" });
  } catch (error) {
    console.log("Error is deleteNotification", error.message);
    return res.status(500).json({ error: "Interval Server Erorr" });
  }
}