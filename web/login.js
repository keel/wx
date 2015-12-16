'use strict';
var error = require('./error');
var express = require('express');
var router = express.Router();
var render = require('./renderTool');
var db = require('./dbWeb');
var bodyParser = require('body-parser');
var auth = require('./auth');

var vlog = require('vlog').instance(__filename);

router.use(bodyParser.urlencoded({
  extended: false
}));
router.get('*', function(req, resp, next) {
  resp.send(render.login());
});
router.post('*', function(req, resp, next) {
  // vlog.log('req headers:%j',req.headers);
  if (!req.body.user || !req.body.pwd) {
    resp.status(403).send(error.json('params', '表单填写不完整'));
    return;
  }
  var query = {
    'loginUser': req.body.user,
    'loginPwd': req.body.pwd,
    'state': {
      $gte: 0
    }
  };
  // vlog.log('query:%j',query);
  db.queryOneFromDb('cp', query, {
    fields: {
      name: 1,
      _id: 1,
      level: 1
    }
  }, function(err, re) {
    if (err) {
      vlog.error(err.stack);
      resp.status(500).send(error.json('db'));
      return;
    }
    if (re) {
      auth.setAuthed(req, resp, re._id, re.level, function(err, re) {
        if (err) {
          vlog.error(err.stack);
          resp.status(500).send(error.json('cache'));
          return;
        }
        resp.status(200).send('ok');
      });
    } else {
      resp.status(200).send(error.json('auth', '用户名密码验证失败，请重试.'));
    }
  });
});

exports.router = router;
