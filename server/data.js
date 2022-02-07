const { Client } = require('pg')

const pError = require('./raise-error')
const JWT = require('./auth-jwt.js')
const router = require('express').Router()

const getSQL = () => {
  const sql = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
  })
  
  sql.connect()
  return sql;
}

router.get('/data/inventory', function (req, res) {

  JWT.check(req, res)
  const startDate = req.query.startDate
  const endDate = req.query.endDate
  
  const sql = getSQL();

  const Query = `SELECT
                    pp.norec AS id,
                    pr.namaproduk AS item_name,
                    djp.detailjenisproduk AS item_type,
                    pr. ID AS item_id,
                    pp.tglkadaluarsa AS expiry_date,
                    pp.jumlah * pp.hargajual AS total_purchase_cost,
                    0 AS total_revenues,
                    pp.hargajual AS unit_cost,
                    'IDR' AS currency,
                    ss.satuanstandar AS unit_type,
                    '' AS purchased_from,
                    ps.namapasien AS sold_to,
                    0 AS quantity_in,
                    pp.jumlah AS quantity_out,
                    pp.stock as soh,
                    'resep' as txn_type,
                    pp.tglpelayanan AS txn_date,
                    sr.noresep as txn_code,
                    sr.norec as txn_id,
                    pp.tglpelayanan AS created_at,
                    pp.tglpelayanan AS last_modified_at,
                    0 as branch_id,
                    pf.namalengkap AS hospital_name,
                    '' as account_name,
                    '' as branch_name
                  FROM
                    pelayananpasien_t pp
                  INNER JOIN strukresep_t sr on sr.norec=pp.strukresepfk
                  INNER JOIN produk_m pr ON pr. ID = pp.produkfk
                  INNER JOIN detailjenisproduk_m djp ON djp. ID = pr.objectdetailjenisprodukfk
                  INNER JOIN profile_m pf ON pf. ID = pp.kdprofile
                  INNER JOIN antrianpasiendiperiksa_t apd ON apd.norec = pp.noregistrasifk
                  INNER JOIN pasiendaftar_t pd ON pd.norec = apd.noregistrasifk
                  INNER JOIN pasien_m ps ON ps. ID = pd.nocmfk
                  INNER JOIN satuanstandar_m ss ON pr.objectsatuanstandarfk = ss.id
                  WHERE
                    tglpelayanan BETWEEN $1 AND $2
                  AND isobat = 't' 

                  union ALL

                  SELECT
                    spd.norec AS id,
                    pr.namaproduk AS item_name,
                    djp.detailjenisproduk AS item_type,
                    pr.id AS item_id,
                    spd.tglkadaluarsa AS expiry_date,
                    spd.harganetto*spd.qtyproduk AS total_purchase_cost,
                    0 AS total_revenues,
                    spd.harganetto AS unit_cost,
                    'IDR' AS currency,
                    ss.satuanstandar AS unit_type,
                    '' AS purchased_from,
                    sp.namapasien_klien AS sold_to,
                    0 AS quantity_in,
                    spd.qtyproduk AS quantity_out,
                    0 as soh,
                    'OBAT BEBAS' as txn_type,
                    sp.tglstruk AS txn_date,
                    sp.nostruk as txn_code,
                    sp.norec as txn_id,
                    sp.tglstruk AS created_at,
                    sp.tglstruk AS last_modified_at,
                    0 as branch_id,
                    pf.namalengkap AS hospital_name,
                    '' as account_name,
                    '' as branch_name
                  FROM
                    strukpelayanan_t sp
                  INNER JOIN strukpelayanandetail_t spd on spd.nostrukfk=sp.norec
                  INNER JOIN produk_m pr ON pr. ID = spd.objectprodukfk
                  INNER JOIN detailjenisproduk_m djp ON djp. ID = pr.objectdetailjenisprodukfk
                  INNER JOIN profile_m pf ON pf. ID = sp.kdprofile
                  INNER JOIN satuanstandar_m ss ON pr.objectsatuanstandarfk = ss. ID
                  WHERE
                    sp.tglstruk BETWEEN $1 AND $2
                  AND sp.objectkelompoktransaksifk=2 

                  union all

                  SELECT
                  spd.norec AS id,
                    pr.namaproduk AS item_name,
                    djp.detailjenisproduk AS item_type,
                    pr.id AS item_id,
                    spd.tglkadaluarsa AS expiry_date,
                    (spd.hargasatuan + spd.hargappn - spd.hargadiscount)*spd.qtyproduk AS total_purchase_cost,
                    0 AS total_revenues,
                    (spd.hargasatuan + spd.hargappn - spd.hargadiscount) AS unit_cost,
                    'IDR' AS currency,
                    ss.satuanstandar AS unit_type,
                    rk.namarekanan AS purchased_from,
                    '' AS sold_to,
                    spd.qtyproduk AS quantity_in,
                    0 AS quantity_out,
                    0 as soh,
                    'PENERIMAAN' as txn_type,
                    sp.tglstruk AS txn_date,
                    sp.nostruk as txn_code,
                    sp.norec as txn_id,
                    sp.tglstruk AS created_at,
                    sp.tglstruk AS last_modified_at,
                    0 as branch_id,
                    pf.namalengkap AS hospital_name,
                    '' as account_name,
                    '' as branch_name

                  FROM
                    strukpelayanan_t sp 
                  INNER JOIN strukpelayanandetail_t spd on spd.nostrukfk=sp.norec
                  INNER JOIN produk_m pr on pr.id=spd.objectprodukfk
                  INNER JOIN detailjenisproduk_m djp on djp.id=pr.objectdetailjenisprodukfk
                  INNER JOIN jenisproduk_m jp on jp.id=djp.objectjenisprodukfk
                  INNER JOIN satuanstandar_m ss on ss.id=pr.objectsatuanstandarfk
                  INNER JOIN rekanan_m rk on rk.id=sp.objectrekananfk
                  INNER JOIN pegawai_m pg on pg.id=sp.objectpegawaipenanggungjawabfk
                  INNER JOIN pegawai_m pg2 on pg2.id=sp.objectpegawaipenerimafk
                  INNER JOIN profile_m pf on pf.id=sp.kdprofile
                  WHERE
                    objectkelompoktransaksifk = 35
                  and sp.tglstruk BETWEEN $1 AND $2

                  union all

                  SELECT
                    kp.norec AS id,
                    pr.namaproduk AS item_name,
                    djp.detailjenisproduk AS item_type,
                    pr.id AS item_id,
                    null AS expiry_date,
                    kp.qtyproduk * kp.harganetto AS total_purchase_cost,
                    0 AS total_revenues,
                    kp.harganetto AS unit_cost,
                    'IDR' AS currency,
                    ss.satuanstandar AS unit_type,
                    '' AS purchased_from,
                    ru.namaruangan AS sold_to,
                    0 AS quantity_in,
                    kp.qtyproduk AS quantity_out,
                    0 as soh,
                    'Amprah Ruangan' as txn_type,
                    sk.tglkirim AS txn_date,
                    sk.nokirim as txn_code,
                    sk.norec as txn_id,
                    sk.tglkirim AS created_at,
                    kp.tglpelayanan AS last_modified_at,
                    0 as branch_id,
                    pf.namalengkap AS hospital_name,
                    '' as account_name,
                    '' as branch_name
                  FROM
                    strukkirim_t sk
                  INNER JOIN kirimproduk_t kp on sk.norec=kp.nokirimfk
                  INNER JOIN produk_m pr ON pr. ID = kp.objectprodukfk
                  INNER JOIN detailjenisproduk_m djp ON djp. ID = pr.objectdetailjenisprodukfk
                  INNER JOIN profile_m pf ON pf. ID = sk.kdprofile
                  INNER JOIN ruangan_m ru on ru.id=sk.objectruangantujuanfk
                  INNER JOIN satuanstandar_m ss ON pr.objectsatuanstandarfk = ss.id
                  WHERE
                    sk.tglkirim BETWEEN $1 AND $2 and nokirim ilike 'AMP%'`

  sql.query(Query, [startDate, endDate], function (_err, results) {
    if (_err) {
      pError.kirimError(res, _err) 
    }
    res.status(200).send(results.rows)
  })
})

router.get('/data/logistics', function (req, res) {

  JWT.check(req, res)
  const startDate = req.query.startDate
  const endDate = req.query.endDate
  
  const sql = getSQL();

  const Query = `SELECT
                  spd.norec as id,
                  spd.objectprodukfk as item_id,
                  pr.namaproduk as  item_name,
                  sp.tglkontrak as  order_date,
                  0 as  order_id,
                  spd.qtyproduk as  order_qty,
                  djp.detailjenisproduk as  item_type,
                  jp.jenisproduk as  sub_type,
                  ss.satuanstandar as unit_type,
                  rk.namarekanan as  supplier_name,
                  rk.id as  supplier_id,
                  pg.namalengkap as  requester_name,
                  pg.id as requester_id,
                  pg2.namalengkap as approver_name,
                  pg2.id as approver_id,
                  sp.tglkontrak as approved_date,
                  sp.tglkontrak + INTERVAL '-7 day' as requested_date,
                  0 as order_status,
                  spd.harganetto + spd.hargappn - spd.harganetto as unit_cost,
                  (spd.harganetto + spd.hargappn - spd.harganetto)*spd.qtyproduk as total_cost,
                  'IDR' as currency,
                  sp.tglstruk as delivered_date,
                  0 as order_status_reason,
                  0 as branch_id,
                  pf.namalengkap as hospital_name,
                  0 as account_name,
                  0 as branch_name,
                  sp.tglstruk as created_at,
                  sp.tglstruk as last_modified_at
                  
                  FROM
                    strukpelayanan_t sp 
                  INNER JOIN strukpelayanandetail_t spd on spd.nostrukfk=sp.norec
                  INNER JOIN produk_m pr on pr.id=spd.objectprodukfk
                  INNER JOIN detailjenisproduk_m djp on djp.id=pr.objectdetailjenisprodukfk
                  INNER JOIN jenisproduk_m jp on jp.id=djp.objectjenisprodukfk
                  INNER JOIN satuanstandar_m ss on ss.id=pr.objectsatuanstandarfk
                  INNER JOIN rekanan_m rk on rk.id=sp.objectrekananfk
                  INNER JOIN pegawai_m pg on pg.id=sp.objectpegawaipenanggungjawabfk
                  INNER JOIN pegawai_m pg2 on pg2.id=sp.objectpegawaipenerimafk
                  INNER JOIN profile_m pf on pf.id=sp.kdprofile
                  WHERE
                    objectkelompoktransaksifk = 35
                  and sp.tglstruk BETWEEN $1 AND $1`

  sql.query(Query, [startDate, endDate], function (_err, results) {
    if (_err) {
      pError.kirimError(res, _err) 
    }
    res.status(200).send(results.rows)
  })
})

module.exports = router




// const Query = `SELECT
  //                 pp.norec AS id,
  //                 pr.namaproduk AS item_name,
  //                 djp.detailjenisproduk AS item_type,
  //                 pr. ID AS item_id,
  //                 null AS expiry_date,
  //                 pp.hargajual AS total_purchase_cost,
  //                 0 AS total_revenues,
  //                 0 AS unit_cost,
  //                 'Rp' AS currency,
  //                 ss.satuanstandar AS unit_type,
  //                 '' AS purchased_from,
  //                 ps.namapasien AS sold_to,
  //                 0 AS quantity_in,
  //                 pp.jumlah AS quantity_out,
  //                 '' as soh,
  //                 'resep' as txn_type,
  //                 pp.tglpelayanan AS txn_date,
  //                 pp.norec as txn_code,
  //                 pp.norec as txn_id,
  //                 pp.tglpelayanan AS created_at,
  //                 pp.tglpelayanan AS last_modified_at,
  //                 0 as branch_id,
  //                 pf.namalengkap AS hospital_name,
  //                 '' as account_name,
  //                 '' as branch_name
  //               FROM
  //                 pelayananpasien_t pp
  //               INNER JOIN produk_m pr ON pr. ID = pp.produkfk
  //               INNER JOIN detailjenisproduk_m djp ON djp. ID = pr.objectdetailjenisprodukfk
  //               INNER JOIN profile_m pf ON pf. ID = pp.kdprofile
  //               INNER JOIN antrianpasiendiperiksa_t apd ON apd.norec = pp.noregistrasifk
  //               INNER JOIN pasiendaftar_t pd ON pd.norec = apd.noregistrasifk
  //               INNER JOIN pasien_m ps ON ps. ID = pd.nocmfk
  //               INNER JOIN satuanstandar_m ss ON pr.objectsatuanstandarfk = ss. ID
  //               WHERE
  //                 tglpelayanan BETWEEN $1 AND $1
  //               AND isobat = 't'

  //               union ALL

  //               SELECT
  //               spd.norec AS id,
  //                 pr.namaproduk AS item_name,
  //                 djp.detailjenisproduk AS item_type,
  //                 pr.id AS item_id,
  //                 spd.tglkadaluarsa AS expiry_date,
  //                 spd.hargasatuan + spd.hargappn - spd.hargadiscount AS total_purchase_cost,
  //                 0 AS total_revenues,
  //                 spd.harganetto AS unit_cost,
  //                 'Rp' AS currency,
  //                 ss.satuanstandar AS unit_type,
  //                 rk.namarekanan AS purchased_from,
  //                 '' AS sold_to,
  //                 spd.qtyproduk AS quantity_in,
  //                 0 AS quantity_out,
  //                 '' as soh,
  //                 'resep' as txn_type,
  //                 sp.tglstruk AS txn_date,
  //                 sp.nostruk as txn_code,
  //                 sp.norec as txn_id,
  //                 sp.tglstruk AS created_at,
  //                 sp.tglstruk AS last_modified_at,
  //                 0 as branch_id,
  //                 pf.namalengkap AS hospital_name,
  //                 '' as account_name,
  //                 '' as branch_name

  //               FROM
  //                 strukpelayanan_t sp 
  //               INNER JOIN strukpelayanandetail_t spd on spd.nostrukfk=sp.norec
  //               INNER JOIN produk_m pr on pr.id=spd.objectprodukfk
  //               INNER JOIN detailjenisproduk_m djp on djp.id=pr.objectdetailjenisprodukfk
  //               INNER JOIN jenisproduk_m jp on jp.id=djp.objectjenisprodukfk
  //               INNER JOIN satuanstandar_m ss on ss.id=pr.objectsatuanstandarfk
  //               INNER JOIN rekanan_m rk on rk.id=sp.objectrekananfk
  //               INNER JOIN pegawai_m pg on pg.id=sp.objectpegawaipenanggungjawabfk
  //               INNER JOIN pegawai_m pg2 on pg2.id=sp.objectpegawaipenerimafk
  //               INNER JOIN profile_m pf on pf.id=sp.kdprofile
  //               WHERE
  //                 objectkelompoktransaksifk = 35
  //               and sp.tglstruk BETWEEN $1 AND $2`


  ///////////////////////////////



    // const Query = `SELECT
  //                 spd.norec as id,
  //                 spd.objectprodukfk as item_id,
  //                 pr.namaproduk as  item_name,
  //                 sp.tglkontrak as  order_date,
  //                 0 as  order_id,
  //                 spd.qtyproduk as  order_qty,
  //                 djp.detailjenisproduk as  item_type,
  //                 jp.jenisproduk as  sub_type,
  //                 ss.satuanstandar as unit_type,
  //                 rk.namarekanan as  supplier_name,
  //                 rk.id as  supplier_id,
  //                 pg.namalengkap as  requester_name,
  //                 pg.id as requester_id,
  //                 pg2.namalengkap as approver_name,
  //                 pg2.id as approver_id,
  //                 sp.tglkontrak as approved_date,
  //                 sp.tglkontrak as requested_date,
  //                 0 as order_status,
  //                 spd.harganetto as unit_cost,
  //                 spd.harganetto + spd.hargappn - spd.harganetto as total_cost,
  //                 'Rp' as currency,
  //                 sp.tglstruk as delivered_date,
  //                 0 as order_status_reason,
  //                 0 as branch_id,
  //                 pf.namalengkap as hospital_name,
  //                 0 as account_name,
  //                 0 as branch_name,
  //                 sp.tglstruk as created_at,
  //                 sp.tglstruk as last_modified_at
                  
  //                 FROM
  //                   strukpelayanan_t sp 
  //                 INNER JOIN strukpelayanandetail_t spd on spd.nostrukfk=sp.norec
  //                 INNER JOIN produk_m pr on pr.id=spd.objectprodukfk
  //                 INNER JOIN detailjenisproduk_m djp on djp.id=pr.objectdetailjenisprodukfk
  //                 INNER JOIN jenisproduk_m jp on jp.id=djp.objectjenisprodukfk
  //                 INNER JOIN satuanstandar_m ss on ss.id=pr.objectsatuanstandarfk
  //                 INNER JOIN rekanan_m rk on rk.id=sp.objectrekananfk
  //                 INNER JOIN pegawai_m pg on pg.id=sp.objectpegawaipenanggungjawabfk
  //                 INNER JOIN pegawai_m pg2 on pg2.id=sp.objectpegawaipenerimafk
  //                 INNER JOIN profile_m pf on pf.id=sp.kdprofile
  //                 WHERE
  //                   objectkelompoktransaksifk = 35
  //                 and sp.tglstruk BETWEEN $1 AND $2`