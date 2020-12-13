const jwt = require("jsonwebtoken");
const InvalidTokens = require("../models/InvalidTokens");

module.exports = async function (req, res, next) {
  const token = req.header("auth-token");
  if (!token) return res.status(401).send("Access Denied");

  const invalidToken = await InvalidTokens.findOne({ token });
  if (invalidToken) return res.status(400).send("Invalid Token");

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
};
