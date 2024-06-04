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

app.use((req, res, next) => {
    res.setHeader('Content-Type', 'multipart/form-data');
    req.headers['content-length'] = '524288000'; 
    next();
});

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get('/words', async (req, res) => {
    const connection = false;

    if (!connection) {
        return res.json({ message: 'Not connected to the database' });
    }

    const words = await connection.query('SELECT * FROM words');

    res.json(words);

});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});