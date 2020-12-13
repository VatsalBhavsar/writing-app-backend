const { string } = require("joi");
const mongoose = require("mongoose");

const InvalidTokenSchema = new mongoose.Schema({
  token: {
    type: String,
  },
});

module.exports = mongoose.model("InvalidTokens", InvalidTokenSchema);
