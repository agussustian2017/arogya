const pError = require('./raise-error')
const JWT = require('./auth-jwt.js')
const router = require('express').Router()
const {v4 : uuidv4} = require('uuid')


router.post('/auth/login', function (req, res) {

  const username = req.body.username
  const password = req.body.password

  if (username == 'arogya@jasamedika.com' && password == 'S3cr3t%3rvice') {

    const payload = {
      username: username,
      sesi: uuidv4()
    }
  
    const hasil = {
      token: JWT.sign(payload),
    }
    
    res.status(200).send(hasil) 

  } else {
    pError.pesanError(res, 'Invalid Username and password')
  }



})

module.exports = router