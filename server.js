require('dotenv').config()
const express = require("express");
const mongojs = require("mongojs");
const logger = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");

const PORT = 3000;

const app = express();
const Transaction = require("./models/transaction.js");

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

// routes
app.use(require("./routes/api.js"));

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});