const { TeamModel } = require("../models/teamModel");
const minMaxPlayers = require("../config/constants/minMaxPlayers");

const {
	getMatchDataFromFile,
	processFieldingPoints,
	processBowlingPoints,
	processBattingPoints,
	chunkArray,
} = require("../services/match");

const {
	checkPlayerRolesCount,
	getTeamPlayersDetails,
	checkExeedsTenFromATeam,
	checkDuplicatePlayerEntry,
} = require("../services/team");

// This is a Controller function to create a new team
const createATeam = async (req, res, next) => {
	try {
		const { teamName, players, captain, vice_captain } = req.body;

		// Validating input data
		if (!teamName || !players || !captain || !vice_captain)
			throw new Error("Every field must be filled");

		if ( captain === vice_captain )
			throw new Error("Cannot choose same player as captain and vice captain");

		if (players.length !== minMaxPlayers.TOTAL_TEAM_MEMBERS)
			throw new Error(
				`There should have ${minMaxPlayers.TOTAL_TEAM_MEMBERS} number of players.`
			);

		// // Checking if any player is entered multiple times
		// const duplicateEntry = checkDuplicatePlayerEntry(players);
		// console.log(duplicateEntry);
		// if (duplicateEntry) throw new Error(`Cannot enter a player multiple times`);

		// Checking if there is a team with same name
		const existingTeam = await TeamModel.findOne({ teamName: teamName });
		if (existingTeam) throw new Error("This team name already exists!!!");

		// Checking captain and vice captain are team members
		let captainATeamMember = players.find((player) => player === captain);
		let viceCaptainATeamMember = players.find(
			(player) => player === vice_captain
		);

		if (!captainATeamMember)
			throw new Error("Captain must be a team member");
		if (!viceCaptainATeamMember)
			throw new Error("Vice captain must be a team member");

		// Function Min & Max Players type in a team, any player type cannot be < 0 or >8
		const teamBalance = await checkPlayerRolesCount(players);
		if (!teamBalance)
			throw new Error(`Each player role should be >0 and <8`);

		// Function to check selected team contains more than 10 members from a team
		const exeedsTen = await checkExeedsTenFromATeam(players);
		if (exeedsTen)
			throw new Error(`Cannot select more than 10 members from a team`);

		// Function to Filter the players details form players.json file based on the 11 players list.
		// And assigning captain and vice captain
		const playersDetails = await getTeamPlayersDetails(
			players,
			captain,
			vice_captain
		);

		// Save team data to the database
		const inserted = await TeamModel.create({
			teamName: teamName,
			players: playersDetails,
			totalPoints: 0,
		});

		// console.log("Added!");
		// console.log(inserted.insertedId);

		res.status(201).send({ data: inserted });
	} catch (error) {
		next(error);
	}
};

// This is a Controller function to see the results of all teams
const teamResult = async (req, res, next) => {
	try {
		const alTeamsResult = await TeamModel.aggregate([
			{ $project: { teamName: 1, totalPoints: 1 } },
			{ $sort: { totalPoints: -1 } },
		]);

		res.status(200).send({ data: alTeamsResult });
	} catch (error) {
		next(error);
	}
};

// This is a Controller function to process the team socre
const processData = async (req, res, next) => {
	// Retrieve all teams data from the database
	try {
		const allTeams = await TeamModel.find();
		// const batchSize = 4; // Adjust batch size as per your requirement
		// const batchedTeams = chunkArray(allTeams, batchSize); // Split teams into batches
		// console.log("batchedTeams ",batchedTeams);
		// // map the array 'batchedTeam' of 4 batches or arrays
		// const processingPromises = batchedTeams.map(async (batch) => {
		// 	// map through all teams in a batch
		// 	const resultPromises = await batch.map(async (team) => {
		// 		// calling processDataForTeam function for each team
		// 		processDataForTeam(team);
		// 	})
		// 	await Promise.all(resultPromises);
		// });

		const resultPromises = allTeams.map(async (team) => {
			// calling processDataForTeam function for each team
			processDataForTeam(team);
		})
		
		// await Promise.all(resultPromises);
		// console.log("processingPromises",resultPromises,"processingPromises");
		const response = await Promise.all(resultPromises);
		console.log("response",response,"response");
		res.status(200).send({ data: "processing done" });
	} catch (error) {
		next(error);
	}
};

// This function process data for team
const processDataForTeam = async (teamData) => {
	const { teamName, players } = teamData;

	// If Not already calculated the result.
	try {
		if (teamData.totalPoints === 0) {
			const playersMap = new Map();
			// Setting player name as key and his data as value
			for (let currentPlayer of players) {
				if (!playersMap.has(currentPlayer.Player)) {
					currentPlayer.wicketsCount = 0;
					currentPlayer.totalRun = 0;
					currentPlayer.totalCaughts = 0;
					playersMap.set(currentPlayer.Player, currentPlayer);
				}
			}
	
			// Get match data from file
			const matchData = await getMatchDataFromFile();
	
			let currentOverRun = 0;
	
			for (let i = 0; i < matchData.length; i++) {
				// Processing Fielding points
				processFieldingPoints(matchData[i], teamData, playersMap);
				// Processing Batting points
				processBattingPoints(matchData[i], teamData, playersMap);
				// Processing Bowling points
				processBowlingPoints(
					matchData[i],
					playersMap,
					teamData,
					currentOverRun
				);
			}
			
			// Saving data to db after process
			await TeamModel.updateOne(
				{ teamName: teamName },
				{
					$set: {
						totalPoints: teamData.totalPoints,
					},
				}
			);
		}
	} catch (error) {
		next(error)
	}
};

module.exports = {
	createATeam,
	processData,
	teamResult,
};
