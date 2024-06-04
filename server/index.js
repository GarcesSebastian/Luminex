//Estructura basica de node con express de prueba usando import
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!',
    })
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

