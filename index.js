const express = require('express');
const app = express();
require('dotenv').config()

const matchRouter = require('./src/routes/matchRouter');
const { connectDb } = require('./src/config/db');

// Middlewares
app.use(express.json())

// Db connection
connectDb()


// Endpoints
app.use('/', matchRouter);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`App listening on port ${PORT}...`));