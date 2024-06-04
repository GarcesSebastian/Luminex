const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const database = require('./database/database');

const app = express();
const port = 4000;

app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

// Elimina el middleware que establece el Content-Type como multipart/form-data
// Este middleware no es necesario y está causando que las respuestas se manejen incorrectamente

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get('/test', async (req, res) => {
    const connection = await database.getConnection();

    if (!connection) {
        return res.json({ message: 'Not connected to the database' });
    }

    const words = await connection.query('SELECT * FROM words');

    res.json(words);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
