module.exports = {
  kirimPesanError: function (res, sql, _err, pesan) {
    res.status(500).send({ error: pesan, sqlError: _err.sqlMessage  })
    sql.rollback(function (_err) { })
    console.error(_err.sqlMessage)
    throw _err.sqlMessage
  },
  kirimError: function(res, _err){
    res.status(500).send({ error: _err.sqlMessage })
    console.error(_err.sqlMessage)
    throw _err.sqlMessage
  },
  checkKosong: function(res, txt, pesan) {
    if (txt === undefined || txt === null || txt === ''){
      res.status(500).send({ error: pesan })
      throw pesan
    }
  },
  pesanError: function(res, pesan){
    res.status(500).send({ error: pesan })
    throw pesan
  }
}
