require('dotenv').config()
var express = require('express')
var app = express()
var cors = require('cors')

app.use(cors())

app.use(express.json({
  extended: true,
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({
  extended: true,
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.set('port', 3311)

var server = null

console.log('HTTP')
var http = require('http')
server = http.createServer(app)

server.listen(app.get('port'), '0.0.0.0', function () {
  console.log('express Server for HTPP / HTTPS Server & Notification Server, listening on port ' + server.address().port)
})


var auth = require('./auth')
var data = require('./data')

app.use('/api', auth)
app.use('/api', data)