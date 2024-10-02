import fs from 'fs/promises';
import path from "path";

import minMaxPlayers from "../config/constants/minMaxPlayers.js";


// To check if selected more than 10 people from a team (either RR or CSK)
const checkExeedsTenFromATeam = async (players) => {
	const playersSet = new Set(players);
	const data = await getPlayersDataFromFile();

	const teamMap = new Map();
	for (let i = 0; i < data.length; i++) {
		if (playersSet.has(data[i].Player)) {
			if (!teamMap.has(data[i].Team)) {
				teamMap.set(data[i].Team, 1);
			} else {
				teamMap.set(data[i].Team, teamMap.get(data[i].Team) + 1);
			}
		}
	}
	// return true if has more than 10 members from any one team
	for (let [key, value] of teamMap) {
		if (value > 10) return true;
	}
	return false;
};

// function Min & Max Players type in a team any player type cannot be < 0 or >8
const checkPlayerRolesCount = async (players) => {
	const playersSet = new Set(players);

	const data = await getPlayersDataFromFile();
	
	const playerTypeMap = new Map();
	for (let i = 0; i < data.length; i++) {
		if (playersSet.has(data[i].Player)) {
			if (!playerTypeMap.has(data[i].Role)) {
				playerTypeMap.set(data[i].Role, 1);
			} else {
				playerTypeMap.set(
					data[i].Role,
					playerTypeMap.get(data[i].Role) + 1
				);
			}
		}
	}

	// Ther are 4 roles in a team of 11, If all player roles are there, a single player type will be > 0 and < 8
	if (playerTypeMap.size == 4) {
		return true;
	} else {
		return false;
	}
};

const getTeamPlayersDetails = async (players, captain, vice_captain) => {
	const playersSet = new Set(players);
	const data = await getPlayersDataFromFile();

	// filter the players details form players.json file based on the 11 players list.
	const arr = data.filter((player) => {
		if (playersSet.has(player.Player)) {
			if (player.Player == captain) {
				player.Captain = true;
				player.ViceCaptain = false;
			} else if (player.Player == vice_captain) {
				player.Captain = false;
				player.ViceCaptain = true;
			} else {
				player.Captain = false;
				player.ViceCaptain = false;
			}

			return player;
		}
	});
	return arr;
};

const getPlayersDataFromFile = async () => {
	// Read file asynchronously
	let fileData = await fs.readFile(
		path.join(__dirname, "../../data/players.json")
	);

	// Converted file data to js object
	let data = JSON.parse(fileData);

	return data;
};

const checkDuplicatePlayerEntry = (players) => {
	console.log("checkDuplicatePlayerEntry",players);
	const team = new Set(players);
	console.log(team);
	console.log(team.size);
	console.log(minMaxPlayers.TOTAL_TEAM_MEMBERS);
	return team.size < minMaxPlayers.TOTAL_TEAM_MEMBER;
};

export  {
	getTeamPlayersDetails,
	checkPlayerRolesCount,
	checkExeedsTenFromATeam,
	checkDuplicatePlayerEntry
};
