const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");

//Import Routes
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");

dotenv.config();

//Connect to DB
mongoose.connect(
  "mongodb://localhost:27017/imaginedDb",
  { useUnifiedTopology: true, useNewUrlParser: true },
  () => console.log("Connected to DB")
);

const connection = mongoose.connection;

connection.once("open", () => {
  console.log("MongoDB connection established successfully!!");
});

//Middleware
app.use(express.json());

//Route Middlewares
app.use("/api/user", authRoute);
app.use("/api/posts", postRoute);

app.listen(3000, () => {
  console.log("Server is running");
});
