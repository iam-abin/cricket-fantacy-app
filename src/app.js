import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { matchRouter } from "./routes/matchRouter.js";
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());

app.use(morgan("dev"));
// Endpoints
app.use("/", matchRouter);
app.all("*", (req, res) => {
    throw new AppError("Route not found", 404);
});

app.use(errorHandler);

export { app };
