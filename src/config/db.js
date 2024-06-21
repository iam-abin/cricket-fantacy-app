const mongoose = require("mongoose");

const connectDb = async () => {
	try {
		await mongoose.connect("mongodb://localhost:27017/cricket11");
		console.log("connected to db.......");
	} catch (error) {
		console.log(error);
	}
};

module.exports = {
	connectDb,
};
