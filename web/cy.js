'use strict';
var error = require('./error');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var vlog = require('vlog').instance(__filename);

var render = require('./renderTool');

router.use(bodyParser.urlencoded({
  extended: false
}));

router.post('*', function(req, resp, next) {
  // vlog.log('req headers:%j',req.headers);
  if (!req.body.cypics) {
    resp.status(403).send(error.json('params', '参数错误,请返回重试.'));
    return;
  }
  resp.send(render.cy({
    'title': '现场冲印',
    'cypics': req.body.cypics
  }));
});

exports.router = router;
