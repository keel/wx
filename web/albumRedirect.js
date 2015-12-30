'use strict';
var vlog = require('vlog').instance(__filename);


var express = require('express');
var router = express.Router();
var client = require('./wechat').oauthClient;


client(function(err, re) {
  if (err) {
    vlog.eo(err, 'oauthClient create');
    return;
  }
  router.get('*', function(req, resp, next) {
    var url = re.getAuthorizeURL('http://kf.loyoo.co/wxt/album', '123', 'snsapi_base');
    // vlog.log('redirect:%j', url);
    resp.redirect(url);
  });

});



exports.router = router;
