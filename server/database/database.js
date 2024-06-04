const mysql = require("mysql2/promise");

const connection = mysql.createConnection({
    host: "roundhouse.proxy.rlwy.net",
    database: "railway",
    user: "root",
    password: "CAPvDjicCyAlhduetMWxbliPZGjibsAf",
    port: 12528,
});

const getConnection = async () => await connection;

module.exports = { getConnection };
