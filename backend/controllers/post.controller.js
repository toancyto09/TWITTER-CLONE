import { v2 as cloudinary } from 'cloudinary';

import User from "../models/user.model.js";
import Post from "../models/post.model.js"
import Notification from "../models/notification.model.js"

export const createPost = async (req, res) => {
  try {
    const { text, img: imgFromReq } = req.body;
    let img = imgFromReq;
    const userID = req.user._id.toString();

    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!text && !img) {
      return res.status(400).json({ error: "post must have text or image" });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userID,
      text,
      img,
    });

    await newPost.save();

    return res.status(200).json(newPost);

  } catch (error) {
    console.log("Error is createPost: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) { return res.status(404).json({ message: "Post not found" }); }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "You are not authorized to delete this post" });
    }

    if (post.img) {
      const postId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(postId);
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Post delete successfully" });
  } catch (error) {
    console.log("Error is deletePost: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postID = req.params.id;
    const userID = req.user._id;

    if (!text) {
      return res.status(400).json({ message: "Text field is required" });
    }

    const post = await Post.findById(postID);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = { user: userID, text };

    post.comments.push(comment);

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error is commentOnPost: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const likeUnlikePost = async (req, res) => {
  try {
    const userID = req.user._id;
    const { id: postID } = req.params;

    const post = await Post.findById(postID);

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    const userLikePost = post.likes.includes(userID);

    if (userLikePost) {
      //unlike post
      await Post.updateOne({ _id: postID }, { $pull: { likes: userID } });
      await User.updateOne({ _id: userID }, { $pull: { likedPosts: postID } });
      return res.status(200).json({ message: "Post unlike sucessfully" });
    } else {
      //like post
      post.likes.push(userID);
      await User.updateOne({ _id: userID }, { $push: { likedPosts: postID } });
      await post.save();

      const notification = new Notification({
        from: userID,
        to: post.user,
        type: "like",
      });

      await notification.save();
      return res.status(200).json({ message: "Post like sucessfully" });
    }
  } catch (error) {
    console.log("Error is likeUnlikePost: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate({
      path: "user",
      select: "-password",
    }).populate({
      path: "comments.user",
      select: "-password",
    });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error is getAllPosts: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const getLikedPosts = async (req, res) => {
  const userID = req.params.id;
  try {
    const user = await User.findById(userID);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } }).
      populate({
        path: "user",
        select: "-password",
      }).
      populate({
        path: "comments.user",
        select: "-password",
      });
    return res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error is getLikedPosts: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const getFollowingPosts = async (req, res) => {
  try {
    const userID = req.user._id;
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error is getFollowingPosts: ", error.message);
    res.status(500).json({ error: error.message });
  }
}

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(post);
  } catch (error) {
    console.log("Error is getUserPosts: ", error.message);
    res.status(500).json({ error: error.message });
  }
}