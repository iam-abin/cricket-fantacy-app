const router = require("express").Router();
const matchController = require("../controllers/matchController")



router.post("/add-team", matchController.createATeam);

router.post("/process-result", matchController.processData);

router.get("/team-result", matchController.teamResult);

module.exports = router;
