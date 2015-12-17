/*
提供给微信打印机获取任务
 */
'use strict';

var error = require('./error');
var express = require('express');
var router = express.Router();
var db = require('./dbweb');
var vlog = require('vlog').instance(__filename);

var redisPrintTaskKeyPre = 'wx:printpics';

router.get('*', function(req, resp, next) {
  // vlog.log('req headers:%j',req.headers);
  if (!req.query.mid) {
    resp.status(403).send(error.json('params'));
    return;
  }
  db.getPrintPic(redisPrintTaskKeyPre + ':' + req.query.mid, function(err, re) {
    if (err) {
      vlog.eo(err, 'getPrintPic');
      return;
    }
    resp.status(200).send(re);
  });
});


exports.router = router;
