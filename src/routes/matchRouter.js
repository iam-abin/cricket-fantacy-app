import express from "express";
import matchController from "../controllers/matchController.js"

const router = express.Router()

router.post("/add-team", matchController.createATeam);

router.post("/process-result", matchController.processData);

router.get("/team-result", matchController.teamResult);

export { router as matchRouter };
