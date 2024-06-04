const mysql = require("promise-mysql");
const dotenv = require("dotenv");
dotenv.config();

const connection = mysql.createConnection({
    host: "localhost",
    database: "luminex",
    user: "root",
    password: "",
});

const getConnection = async () => await connection;

module.exports = { getConnection };