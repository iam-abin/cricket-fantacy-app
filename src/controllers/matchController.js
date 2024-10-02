import { TeamModel } from "../models/teamModel.js";
import minMaxPlayers from "../config/constants/minMaxPlayers.js";

import {
    getMatchDataFromFile,
    processFieldingPoints,
    processBowlingPoints,
    processBattingPoints,
    chunkArray,
} from "../services/match.js";

import {
    checkPlayerRolesCount,
    getTeamPlayersDetails,
    checkExeedsTenFromATeam,
    checkDuplicatePlayerEntry,
} from "../services/team.js";
import { httpResponseBody } from "../utils/response.js";
import { AppError } from "../errors/app-error.js";

// This is a Controller function to create a new team
const createATeam = async (req, res, next) => {
    try {
        const { teamName, players, captain, vice_captain } = req.body;

        // Validating input data
        if (!teamName || !players || !captain || !vice_captain)
            throw new AppError("Every field must be filled", 400);

        if (captain === vice_captain)
            throw new AppError(
                "Cannot choose same player as captain and vice captain",
                400
            );

        if (players.length !== minMaxPlayers.TOTAL_TEAM_MEMBERS)
            throw new AppError(
                `There should have ${minMaxPlayers.TOTAL_TEAM_MEMBERS} number of players.`,
                400
            );

        // Checking if there is a team with same name
        const existingTeam = await TeamModel.findOne({ teamName: teamName });
        if (existingTeam)
            throw new AppError("This team name already exists!!!", 400);

        // Checking captain and vice captain are team members
        let captainATeamMember = players.find((player) => player === captain);
        let viceCaptainATeamMember = players.find(
            (player) => player === vice_captain
        );

        if (!captainATeamMember)
            throw new AppError("Captain must be a team member", 400);
        if (!viceCaptainATeamMember)
            throw new AppError("Vice captain must be a team member", 400);

        // Function Min & Max Players type in a team, any player type cannot be < 0 or >8
        const teamBalance = await checkPlayerRolesCount(players);
        if (!teamBalance)
            throw new AppError(`Each player role should be >0 and <8`, 400);

        // Function to check selected team contains more than 10 members from a team
        const exeedsTen = await checkExeedsTenFromATeam(players);
        if (exeedsTen)
            throw new AppError(
                `Cannot select more than 10 members from a team`,
                400
            );

        // Function to Filter the players details form players.json file based on the 11 players list.
        // And assigning captain and vice captain
        const playersDetails = await getTeamPlayersDetails(
            players,
            captain,
            vice_captain
        );

        // Save team data to the database
        const createdTeam = await TeamModel.create({
            teamName: teamName,
            players: playersDetails,
            totalPoints: 0,
        });

        res.status(201).send(httpResponseBody("Team created", createdTeam));
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

        res.status(200).send(httpResponseBody("Team result is", alTeamsResult));
    } catch (error) {
        next(error);
    }
};

// This is a Controller function to process the team socre
const processData = async (req, res, next) => {
    // Retrieve all teams data from the database
    try {
        const allTeams = await TeamModel.find();
        const resultPromises = allTeams.map(async (team) => {
            // calling processDataForTeam function for each team
            processDataForTeam(team);
        });

        const response = await Promise.all(resultPromises);
        console.log("response", response, "response");
        res.status(200).send(httpResponseBody("processing done"));
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
        next(error);
    }
};

export default {
    createATeam,
    processData,
    teamResult,
};
