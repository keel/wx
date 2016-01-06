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

var brows = function(agent) { //移动终端浏览器版本信息
  if (!agent) {
    return null;
  }
  return {
    ios: !!agent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
    android: agent.indexOf('Android') > -1 || agent.indexOf('Linux') > -1, //android终端或者uc浏览器
    iPhone: agent.indexOf('iPhone') > -1 || agent.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
    iPad: agent.indexOf('iPad') > -1 //是否iPad
  };
};

router.post('*', function(req, resp, next) {
  // vlog.log('order req headers:%j',req.headers);
  if (!req.body.openId) {
    resp.status(403).send(error.json('params', '参数错误,请返回重试.'));
    return;
  }
  var agent = req.headers['user-agent'];
  var brw = brows(agent);
  if (brw.ios) {
    var ver = agent.substring(agent.indexOf('CPU'),agent.indexOf('like')).split(' ');
    brw.ver = ver[ver.length-2].split('_')[0];
    // vlog.log('ver:%j,vv:%j',ver,ver[ver.length-2].split('_')[0]);
  }
  // vlog.log('agent:%j, brw:%j',req.headers['user-agent'], brw);
  resp.send(render.order({
    'title': '我的尊享',
    'openId': req.body.openId,
    'brows': brw
  }));
});

exports.router = router;

// var agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_1 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Mobile/11D167 MicroMessenger/6.3.9 NetType/WIFI Language/zh_CN';
// var ver = agent.substring(agent.indexOf('CPU'),agent.indexOf('like')).split(' ');
// // var verstr = verarr[verarr.length-2];
// // var ver  = verstr.substring(0,verstr.indexOf('_'));
