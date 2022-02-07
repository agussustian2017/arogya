const mysql = require('mysql')

var sql = mysql.createConnection({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
})

sql.on('error', (_err) => {
  console.error('Connection error ' + _err.sqlMessage)
  throw _err.sqlMessage
});

module.exports = sql