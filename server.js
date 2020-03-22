
require('dotenv').config()
const express = require("express");
const path = require("path");
const logger = require("morgan");
const mongojs = require("mongojs");
const mongoose = require("mongoose");
const compression = require("compression");

const PORT = 3500;

const app = express();
const Budget = require("./models/budgetModel.js");

app.use(logger("dev"));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useFindAndModify: false
});

const databaseUrl = process.env.MONGODB_URI;
const collections = ["budgets"];

const db = mongojs(databaseUrl, collections);

db.on("error", error => {
    console.log("Database Error:", error);
  });

// routes here
require("./routes/html-routes.js")(app);
require("./routes/api-routes.js")(app);

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
