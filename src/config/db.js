const mongoose = require("mongoose");

const connectDb = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URL);
		console.log("connected to db.......");
	} catch (error) {
		console.log(error);
		throw new Error("Database connection error")
	}
};

module.exports = {
	connectDb,
};
