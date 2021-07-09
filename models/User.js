const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    phone: String,
    avatar: { type: mongoose.Schema.Types.Mixed, default: {} }, //accepte n'importe quel type de variable
  },
  token: { type: String },
  hash: { type: String, select: false },
  salt: { type: String, select: false },
});

module.exports = User;
