const fs = require("fs");
const path = require("path");

const battingPoints = require("../constants/battingPoints");
const bowlingPoints = require("../constants/bowlingPoints");
const fieldingPoints = require("../constants/fieldingPoints");
const roles = require("../constants/roles");
const { captainsPoint, viceCaptainsPoint } = require("../services/points");

const getMatchDataFromFile = async () => {
	// Read file asynchronously
	let fileData = await fs.readFile(
		path.join(__dirname, "../../data/match.json")
	);

	// Converted file data to js object
	let data = JSON.parse(fileData);

	return data;
};

const processFieldingPoints = (currentBowlData, teamData, playersMap) => {
	// First check whether a fielder in volved in that specific fielding 'point getting' activity
	if (currentBowlData.fielders_involved !== "NA") {
		// Get the fielder who took the catch
		let fielderData = playersMap.get(currentBowlData.fielders_involved);

		// Checking for wicket types by fielders
		if (fielderData) {
			if (currentBowlData.kind === "caught") {
				teamData.totalPoint += fieldingPoints.CATCH;

				fielderData.totalCaughts = (fielderData.totalCaughts || 0) + 1;

				if (fielderData.totalCaughts === 3)
					teamData.totalPoint += fieldingPoints.THREE_CATCH_BONUS;
			}
			if (currentBowlData.kind === "stumping")
				teamData.totalPoint += fieldingPoints.STUMPING;

			if (currentBowlData.kind === "run out")
				teamData.totalPoint += fieldingPoints.RUN_OUT;
		}
	}
};

const processBowlingPoints = (currentBowlData, playersMap, teamData, currentOverRun) => {
	// To get the currently throwing bowler and take him form our team list
	let bowlerData = playersMap.get(currentBowlData.bowler);

	// Update current over run
	if (bowlerData) {
		currentOverRun += currentBowlData.total_run;

		// CHecking maiden over
		if (currentBowlData.ballNumber == 6) {
			if (currentOverRun == 0) {
				teamData.totalPoint += bowlingPoints.MAIDEN_OVER;
			}
			currentOverRun = 0;
		}

		// Check for wicket delivery and delivery done by our team member
		if (currentBowlData.isWicketDelivery && bowlerData) {
			bowlerData.wicketsCount++;

			if (bowlerData.wicketsCount >= 3) {
				teamData.totalPoint += bowlingPoints.THREE_WICKET_BONUS;
			}
			if (bowlerData.wicketsCount >= 4) {
				teamData.totalPoint += bowlingPoints.FOUR_WICKET_BONUS;
			}
			if (bowlerData.wicketsCount === 5) {
				teamData.totalPoint += bowlingPoints.FIVE_WICKET_BONUS;
			}

			if (currentBowlData.kind !== "run out") {
				teamData.totalPoint += bowlingPoints.WICKET_EXCLUDING_RUN_OUT;
			}

			if (currentBowlData.kind === "lbw" || currentBowlData.kind === "bowled") {
				teamData.totalPoint += bowlingPoints.BONUS_LBW_OR_BOWLED;
			}
		}
	}
};
const processBattingPoints = (currentBowlData, teamData, playersMap) => {
	// To get the current batter and take him form our team list
	let batterData = playersMap.get(currentBowlData.batter);

	// Work only for the batsman in out team
	if (batterData) {
		switch (currentBowlData.batsman_run) {
			case 4:
				if (batterData.Captain) {
					teamData.totalPoint += captainsPoint(
						battingPoints.BOUNDARY_BONUS
					);
				} else if (batterData.ViceCaptain) {
					teamData.totalPoint += viceCaptainsPoint(
						battingPoints.BOUNDARY_BONUS
					);
				} else {
					teamData.totalPoint += battingPoints.BOUNDARY_BONUS;
				}
				break;
			case 6:
				if (batterData.Captain) {
					teamData.totalPoint += captainsPoint(
						battingPoints.SIX_BONUS
					);
				} else if (batterData.ViceCaptain) {
					teamData.totalPoint += viceCaptainsPoint(
						battingPoints.SIX_BONUS
					);
				} else {
					teamData.totalPoint += battingPoints.SIX_BONUS;
				}
				break;
			default:
				// case of 1 or 2 or 3
				if (batterData.Captain) {
					teamData.totalPoint += captainsPoint(
						battingPoints.RUN * currentBowlData.batsman_run
					);
				} else if (batterData.ViceCaptain) {
					teamData.totalPoint += viceCaptainsPoint(
						battingPoints.RUN * currentBowlData.batsman_run
					);
				} else {
					teamData.totalPoint +=
						battingPoints.RUN * currentBowlData.batsman_run;
				}
				break;
		}

		// Calculate runs of current batsman
		batterData.totalRun =
			(batterData.totalRun || 0) + currentBowlData.batsman_run;

		// Add points based on run scored by batsman
		if (batterData.totalRun === 30)
			teamData.totalPoint += battingPoints.THIRTY_RUN_BONUS;

		if (batterData.totalRun === 50)
			teamData.totalPoint += battingPoints.HALF_CENTURY_BONUS;

		if (batterData.totalRun === 100)
			teamData.totalPoint += battingPoints.CENTURY_BONUS;

		// Check for Duck
		// Dismissal for a duck 	-2 (Batter, Wicket-Keeper & All-Rounder only) ie, except bowler
		if (currentBowlData.player_out !== "NA") {
			if (
				currentBowlData.batter == batterData.Player &&
				batterData.totalRun == 0 &&
				batterData.Role !== roles.BOWLER
			) {
				teamData.totalPoint += battingPoints.DISMISSAL_FOR_A_DUCK;
			}
		}
	}
};

// Utility function to chunk array into smaller batches
const chunkArray = (array, chunkSize) => {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunkedArray.push(array.slice(i, i + chunkSize));
    }
    return chunkedArray;
};

module.exports = {
	getMatchDataFromFile,
	processFieldingPoints,
	processBowlingPoints,
	processBattingPoints,
	chunkArray,
};
