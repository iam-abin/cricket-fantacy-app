import { app } from "./app.js";
import { connectDb } from "./config/db.connection.js";

await connectDb();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`App listening on port ${PORT}...`));
