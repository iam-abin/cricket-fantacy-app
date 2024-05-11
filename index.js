const express = require('express');
const app = express();
const port = 3000;
require('dotenv').config()

const matchRouter = require('./src/routes/matchRouter');
const { connectDb } = require('./src/config/db');

// Middlewares
app.use(express.json())

// Db connection
connectDb()


// Endpoints
app.use('/', matchRouter);

app.listen(port, () => console.log(`App listening on port ${port}`));