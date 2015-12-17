'use strict';
var error = require('./error');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var vlog = require('vlog').instance(__filename);

var render = require('./renderTool');
var db = require('./dbweb');

router.use(bodyParser.urlencoded({
  extended: false
}));

router.post('*', function(req, resp, next) {
  // vlog.log('req headers:%j',req.headers);
  if (!req.body.cypics || !req.body.mid) {
    resp.status(403).send(error.json('params', '参数错误,请返回重试.'));
    return;
  }
  //提交到redis等待处理
  db.addPrintPics(req.body.cypics, req.body.mid, function(err, re) {
    if (err) {
      vlog.eo(err, 'addPrintPics');
      resp.status(500).send(error.json('db', '照片提交失败,请重试.'));
      return;
    }
    resp.send(render.cyz({
      'title': '现场冲印',
      'cypics': req.body.cypics
    }));
  });

});

exports.router = router;
