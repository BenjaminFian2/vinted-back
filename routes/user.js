const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    if (req.fields.username) {
      const user = await User.findOne({ email: req.fields.email });
      if (!user) {
        const salt = uid2(16);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const token = uid2(64);
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          token: token,
          hash: hash,
          salt: salt,
        });
        if (req.files.picture) {
          newUser.account.avatar = await cloudinary.uploader.upload(
            req.files.picture.path,
            {
              folder: `/vinted/users/${newUser._id}`,
            }
          );
        }
        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(409).json({ message: "This account  already exist !" });
      }
    } else {
      res.status(400).json({ message: "A username is required !" });
    }
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    if (req.fields.email) {
      const user = await User.findOne({ email: req.fields.email });
      if (user) {
        const newHash = SHA256(req.fields.password + user.salt).toString(
          encBase64
        );
        if (newHash === user.hash) {
          res.status(200).json({
            _id: user._id,
            token: user.token,
            account: {
              username: user.account.username,
              phone: user.account.phone,
            },
          });
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "An email is required !" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
