'use strict';
var error = require('./error');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var vlog = require('vlog').instance(__filename);
var db = require('./dbweb');

var render = require('./renderTool');

router.use(bodyParser.urlencoded({
  extended: false
}));

router.post('*', function(req, resp, next) {
  // vlog.log('req headers:%j',req.headers);
  if (!req.body.phone || !req.body.openId)  {
    resp.status(403).send(error.json('params', '参数错误,请返回重试.'));
    return;
  }

  db.bindUser(req.body.openId,req.body.phone,function(err, re) {
    if (err) {
      vlog.eo(err, 'bind');
      resp.status(500).send(error.json('db'));
      return;
    }
    resp.status(200).send('ok');
  });


});

exports.router = router;
