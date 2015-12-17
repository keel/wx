'use strict';
var vlog = require('vlog').instance(__filename);
var error = require('./error');
var express = require('express');
var router = express.Router();
var render = require('./renderTool');
var db = require('./dbweb');
// var bodyParser = require('body-parser');

var client = require('./wechat').oauthClient;



// router.use(bodyParser.urlencoded({
//   extended: false
// }));


router.get('*', function(req, resp, next) {
  // vlog.log('req.query:%j,%j', req.query,req.query.code);
  var code = req.query.code;
  if (!code) {
    resp.status(403).send(error.json('auth'));
    return;
  }
  //判断openId的绑定
  client.getAccessToken(code, function(err, result) {
    if (err) {
      vlog.eo(err, 'getAccessToken');
      resp.status(403).send(error.json('auth'));
      return;
    }
    // var accessToken = result.data.access_token;
    var openId = result.data.openid;
    db.checkUserPics(openId, function(err, re) {
      if (err) {
        vlog.eo(err, 'checkUserPics');
        resp.status(403).send(error.json('checkUserPics'));
        return;
      }
      if (!re) {
        resp.status(403).send(error.json('checkUserPics'));
        return;
      }
      resp.send(render.album({
        'title': '我的相册',
        'user': re
      }));

    });

  });
});



exports.router = router;
