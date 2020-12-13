const router = require("express").Router();
const User = require("../models/User");
const {
  registerValidationSchema,
  loginValidationSchema,
} = require("../validations");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    const user = await User.findOne({ email: userReq.email });
    if (!user)
      return res
        .status(400)
        .send({ message: "Account with this email id doesn't exist" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword)
      return res.status(400).send({ message: "Incorrect password" });

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    res
      .header("auth-token", token)
      .send({ message: "Login successful!", token });
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
