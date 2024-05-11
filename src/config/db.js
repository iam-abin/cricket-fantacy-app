const { MongoClient, ServerApiVersion } = require("mongodb");

// Database Details
const DB_USER = process.env["DB_USER"];
const DB_PWD = process.env["DB_PWD"];
const DB_URL = process.env["DB_URL"];
const DB_NAME = "task-jeff";

const uri = "mongodb+srv://"+DB_USER+":"+DB_PWD+"@"+DB_URL+"/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

const connectDb = async () => {
	await client.connect();
	await client.db("admin").command({ ping: 1 });
	console.log("connected to db.......");
};

const db = client.db(DB_NAME);

module.exports = {
	connectDb,
	db,
};
