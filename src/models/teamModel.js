import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
	teamName: String,
	players: {
		type: Array,
		validate: [arrayLimit, "{PATH} exceeds the limit of 11"],
	},
	totalPoints: {
        type: Number,
		default: 0,
	},
});

function arrayLimit(val) {
	return val.length <= 11;
	
}

const TeamModel = mongoose.model("TeamMOdel", teamSchema);

export  { TeamModel };
