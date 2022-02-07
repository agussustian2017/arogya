
const { JWT, JWK } = require('jose')

const key = JWK.asKey({
  kty: 'oct',
  k: process.env.KEY
})

module.exports = {
  sign: function (payload) {
    return JWT.sign(payload, key, { expiresIn: '24 hours' })
  },
  verify: function (token) {
    return JWT.verify(token, key)
  },
  check: function (req, res) {
    var token = req.headers.authorization
    try {
      const session = this.verify(token)
      return session
    } catch (_err) {
      res.status(503).send({ error: 'Session Expires' })
      console.error(_err)
      throw 'Session Expires'
    }
  }
}
