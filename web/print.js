/*
提供给微信打印机获取任务
 */
'use strict';

var error = require('./error');
var express = require('express');
var router = express.Router();
var db = require('./dbweb');
var vlog = require('vlog').instance(__filename);


router.get('*', function(req, resp, next) {
  // vlog.log('req headers:%j',req.headers);
  // vlog.log('print mid:%j',req.query.mid);
  if (!req.query.mid) {
    resp.status(403).send(error.json('params'));
    return;
  }
  db.getPrintPic(req.query.mid, function(err, re) {
    if (err) {
      vlog.eo(err, 'getPrintPic');
      return;
    }
    // if (re) {
    //   vlog.log('will print:%j',re);
    // }else{
    //   vlog.log('no pic');
    // }
    var out = re || 'null';
    // vlog.log('print will re:%j,out:%j',re,out);
    resp.status(200).send(out);
  });
});


exports.router = router;
