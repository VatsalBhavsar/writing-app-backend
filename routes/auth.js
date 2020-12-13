const router = require("express").Router();
const User = require("../models/User");
const InvalidTokens = require("../models/InvalidTokens");
const {
  registerValidationSchema,
  loginValidationSchema,
} = require("../validations");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const verify = require("./verifyToken");
const oauthDetails = require("../oauth.json");

const oauth2Client = new OAuth2(
  oauthDetails.clientId,
  oauthDetails.clientSecret,
  "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: oauthDetails.refreshToken,
});

const accessToken = oauth2Client.getAccessToken();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: oauthDetails.email,
    clientId: oauthDetails.clientId,
    clientSecret: oauthDetails.clientSecret,
    refreshToken: oauthDetails.refreshToken,
    accessToken,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

router.post("/register", async (req, res) => {
  try {
    const userReq = await registerValidationSchema.validateAsync(req.body);

    const emailExists = await User.findOne({ email: userReq.email });

    if (emailExists)
      return res
        .status(400)
        .send({ message: "Account with this email id already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userReq.password, salt);

    const user = new User({ ...userReq, password: hashedPassword });

    try {
      const savedUser = await user.save();

      jwt.sign(
        { _id: user._id },
        process.env.EMAIL_SECRET,
        {
          expiresIn: "1d",
        },
        (err, emailToken) => {
          if (err) console.log(err);

          const confirmationUrl = `http://localhost:3000/api/user/confirmation/${emailToken}`;

          transporter.sendMail(
            {
              from: oauthDetails.email,
              to: userReq.email,
              subject: "Email confirmation",
              html: `Please click the following link to confirm your email: <a href="${confirmationUrl}">${confirmationUrl}</a>`,
            },
            (err, info) => {
              if (err) console.log("mail error - ", err);
              else console.log("mail info - ", info);
            }
          );
        }
      );

      res.send({
        message: "User created successfully",
        name: savedUser.name,
        id: savedUser._id,
      });
    } catch (err) {
      res.status(400).send(err);
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const userReq = await loginValidationSchema.validateAsync(req.body);

    const user = await User.findOne({ username: userReq.username });

    if (!user)
      return res
        .status(400)
        .send({ message: "Username or password is incorrect" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!user.isAccountVerified)
      return res
        .status(400)
        .send({ message: "Please verify your email address to login" });

    if (!validPassword)
      return res.status(400).send({ message: "Incorrect password" });

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "1d",
    });
    res
      .header("auth-token", token)
      .send({ message: "Login successful!", token });
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get("/confirmation/:token", async (req, res) => {
  try {
    const user = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const result = await User.updateOne(
      { _id: user._id },
      { $set: { isAccountVerified: true } }
    );
    res.send(result);
    // res.redirect(""); //Redirect to login page URL
  } catch (err) {
    res.send(err);
  }
});

router.post("/logout", verify, async (req, res) => {
  const token = req.header("auth-token");
  const invalidToken = new InvalidTokens({ token });
  try {
    await invalidToken.save();
    res.send({ message: "Logged out successfully" });
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
