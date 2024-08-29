import bcrypt from "bcryptjs";
import { v2 as cloudinary } from 'cloudinary';
//MODEL
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";


export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.log("Error is getUserProfle: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    //lay ra user duoc follow
    const userToMondify = await User.findById(id);
    //lay ra user thuc hien follow
    const currentUser = await User.findById(req.user._id);

    //neu cung 1 nguoi khong the follow
    if (id === req.user._id) {
      return res.status(400).json({ error: "You can't follow/unfollow yourself" });
    }

    //khong tim thay user
    if (!userToMondify || !currentUser) return res.status(400).json({ error: "User not found !" });

    const isFolowing = currentUser.following.includes(id);

    if (isFolowing) {
      //unfollow user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      return res.status(200).json({ message: "User unfollow succesfully" });
    } else {
      //follow user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      //Notification follow
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToMondify._id,
      });

      await newNotification.save();

      return res.status(200).json({ message: "User followed succesfully" });
    }

  } catch (error) {
    console.log("Error is followUnfollowUser: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const getSuggestedUsers = async (req, res) => {
  try {
    const userID = req.user._id;
    const usersFollowedByMe = await User.findById(userID).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userID },
        }
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);

  } catch (error) {
    console.log("Error is getSuggestedUsers: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const updateUserProfile = async (req, res) => {
  const { fullname, email, username, currentPassword, newPassword, bio, link } = req.body;
  let { profileImg, coverImg } = req.body;
  const userID = req.user._id;
  try {
    let user = await User.findById(userID);
    //kiem tra ton tai user
    if (!user) return res.status(404).json({ message: "User not found" });

    //kiem tra mat khau cu va mat khau moi co ton tai
    if ((!newPassword && currentPassword) || (newPassword && !currentPassword)) {
      res.status(400).json({ error: "Please provide both current password and new password" });
    }

    //check mat khau cu co trung voi mat khau hien tai va ma hoa mat khau moi
    if (newPassword && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) res.status(400).json({ error: "Current password is incorrect" });
      if (newPassword.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    //update profile Img
    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    //update cover Img
    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    //update user
    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    //set password tra ve null
    user.password = null;

    res.status(200).json(user);

  } catch (error) {
    console.log("Error is updateUserProfile: ", error.message);
    res.status(500).json({ error: error.message });
  }
}