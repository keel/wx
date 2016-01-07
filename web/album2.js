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
  resp.send(render.album({
    'title': '我的相册',
    'user': {
      '_id': '1111',
      'openId': 'ow_7Ow2IrZOYEEys_bkVNFyGailE',
      'createTime': 123456,
      'state': 0,
      'phone': '',
      'orderTime': 0,
      'exitTime': 0,
      'wxPoint': 3,
      'pics': [{
        '_id': '2341234',
        'url': 'http://kf.loyoo.co/wxpics/ow_7Ow2IrZOYEEys_bkVNFyGailE/tb__6236886624134712170.jpg'
      }, {
        '_id': '2341232234',
        'url': 'http://kf.loyoo.co/wxpics/ow_7Ow2IrZOYEEys_bkVNFyGailE/tb__6236886624134712170.jpg'
      }, {
        '_id': '234123534',
        'url': 'http://kf.loyoo.co/wxpics/ow_7Ow2IrZOYEEys_bkVNFyGailE/tb__6236886624134712171.jpg'
      }, {
        '_id': '23412324',
        'url': 'http://kf.loyoo.co/wxpics/ow_7Ow2IrZOYEEys_bkVNFyGailE/tb__6236886624134712171.jpg'
      }]
    }
  }));
});



exports.router = router;
