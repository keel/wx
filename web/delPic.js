'use strict';
var error = require('./error');
var express = require('express');
var router = express.Router();
var db = require('./dbweb');
var bodyParser = require('body-parser');
var vlog = require('vlog').instance(__filename);

router.use(bodyParser.urlencoded({
  extended: false
}));

router.post('*', function(req, resp, next) {
  // vlog.log('req headers:%j',req.headers);
  if (!req.body.pid) {
    resp.status(403).send(error.json('params'));
    return;
  }
  db.delPic(req.body.pid, function(err) {
    if (err) {
      vlog.eo(err, 'delPic.db');
      resp.status(500).send(error.json('db'));
      return;
    }
    resp.status(200).send('ok');
  });
});

exports.router = router;
