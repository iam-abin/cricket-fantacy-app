const express = require("express");
const app = express();
require("dotenv").config();
const logger = require("morgan");

const matchRouter = require("./src/routes/matchRouter");
const { connectDb } = require("./src/config/db");
const { errorHandler } = require("./src/middlewares/errorHandler");

// Middlewares
app.use(express.json());

// Db connection
connectDb();

app.use(logger("dev"));
// Endpoints
app.use("/", matchRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`App listening on port ${PORT}...`));
