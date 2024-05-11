const { db } = require("../config/db");

const minMaxPlayers = require("../constants/minMaxPlayers");

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
} = require("../services/team");

const DB_COLLECTION_NAME = process.env.DB_COLLECTION_NAME;


// This is a Controller function to create a new team
const createATeam = async (req, res) => {
	const { teamName, players, captain, vice_captain } = req.body;

	// Validating input data
	if (!teamName || !players || !captain || !vice_captain)
		throw new Error("Every field must be filled");

	if (players.length !== minMaxPlayers.TOTAL_TEAM_MEMBERS)
		throw new Error(
			`There should have ${minMaxPlayers.TOTAL_TEAM_MEMBERS} number of players.`
		);

	// Checking if there is a team with same name
	const isTeamExist = await db
		.collection(DB_COLLECTION_NAME)
		.findOne({ teamName: teamName });
	if (isTeamExist) throw new Error("This team name already exists!!!");

	// Checking captain and vice captain are team members
	let captainATeamMember = players.find((player) => player === captain);
	let viceCaptainATeamMember = players.find(
		(player) => player === vice_captain
	);

	if (!captainATeamMember) throw new Error("Captain must be a team member");
	if (!viceCaptainATeamMember)
		throw new Error("Vice captain must be a team member");

	// Function Min & Max Players type in a team, any player type cannot be < 0 or >8
	const teamBalance = await checkPlayerRolesCount(players);
	if (!teamBalance) throw new Error("Each player role should be >0 and <8");

	// Function to check selected team contains more than 10 members from a team
	const exeedsTen = await checkExeedsTenFromATeam(players);

	if (exeedsTen)
		throw new Error("Cannot select more than 10 members from a team");

	// Function to Filter the players details form players.json file based on the 11 players list.
	// And assigning captain and vice captain
	const playersDetails = await getTeamPlayersDetails(
		players,
		captain,
		vice_captain
	);

	// Save team data to the database
	const inserted = await db.collection(DB_COLLECTION_NAME).insertOne({
		teamName: teamName,
		players: playersDetails,
		totalPoint: 0,
	});

	console.log("Added!");
	console.log(inserted.insertedId);

	res.send({ data: playersDetails });
};


// This is a Controller function to process the team socre
const processData = async (req, res) => {
	// Retrieve all teams data from the database
	const allTeams = await db.collection(DB_COLLECTION_NAME).find().toArray();
	const batchSize = 4; // Adjust batch size as per your requirement
	const batchedTeams = chunkArray(allTeams, batchSize); // Split teams into batches

	// map the array 'batchedTeam' of 4 batches or arrays
	const processingPromises = batchedTeams.map(async (batch) => {
		// map through all teams in a batch
		await Promise.all( batch.map(async (team) => {
			// calling processDataForTeam function for each team
				await processDataForTeam(team);
			})
		);
	});

	const response = await Promise.all(processingPromises);

	res.send({ data: "processing done" });
};

// This function process data for team
const processDataForTeam = async (teamData) => {
	const { teamName } = teamData;
	const {players} = teamData;
	console.log(players);

	// If Not already calculated the result.
	if (!teamData.totalPoint) {
		const playersMap = new Map();
		// Setting player name as key and his data as value
		for (let player of players) {
			if (!playersMap.has(player.Player)) {
				player.wicketsCount = 0;
				player.totalRun = 0;
				player.totalCaughts = 0;
				playersMap.set(player.Player, player);
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

		teamData.players = players;

		// Saving data to db after process
		await db.collection(DB_COLLECTION_NAME).updateOne(
			{ teamName: teamName },
			{
				$set: {
					players: Array.from(playersMap.values()),
					totalPoint: teamData.totalPoint,
				},
			}
		);
	}
};

// This is a Controller function to see the results of all teams
const teamResult = async (req, res) => {
	const alTeamsResult = await db
		.collection(DB_COLLECTION_NAME)
		.aggregate([
			{ $project: { teamName: 1, totalPoint: 1 } },
			{ $sort: { totalPoint: -1 } },
		])
		.toArray();

	res.send({ data: alTeamsResult });
};

module.exports = {
	createATeam,
	processData,
	teamResult,
};
