/*
http://wx.loyoo.co/print/index.html

 */

'use strict';

var vlog = require('vlog').instance(__filename);
var http = require('http');
var token = 'p3WqgTyqearyMvSTsIK8Yqm4Z61RD1nL';
var wechat = require('./wechat')(token);
var port = 16000;
var cache = require('./cache');

var init = function(callback) {
  var configArr = ['wxPort'];
  cache.readConfig(configArr, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'init:readConfig'));
    }
    // vlog.log('wxPort:%j',re.wxPort);
    port = re.wxPort;
    callback(null, re);
  });
};

var server = http.createServer(function(req, res) {
  //检验 token
  wechat.checkSignature(req, res);
  //预处理
  wechat.handler(req, res);

  //监听文本信息
  wechat.text(function(data) {
    //console.log(data.ToUserName);
    //console.log(data.FromUserName);
    //console.log(data.CreateTime);
    //console.log(data.MsgType);
    //...
    vlog.log('data:%j', data);
    var msg = {
      FromUserName: data.ToUserName,
      ToUserName: data.FromUserName,
      //MsgType : 'text',
      Content: '嗯,有坑?'
        //FuncFlag : 0
    };
    //回复信息
    wechat.send(msg);
  });

  //监听图片信息
  wechat.image(function(data) {
    vlog.log('img data:%j', data);
    // img data:{"ToUserName":"gh_a4d0dc565e2e","FromUserName":"oszWVxGVsA_0echDtb0isj908-ek",
    // "CreateTime":"1449395267","MsgType":"image",
    // "PicUrl":"http://mmbiz.qpic.cn/mmbiz/1ToDdXGszdsIc5TpsVyEEBZjHE7M51QBspQXHUqGjId6CNbXDPaI8F0QVzOsmuZH25529gRTKb5seU9xCCX50g/0",
    // "MsgId":"6225105271142938457","MediaId":"zk81ScAcRZTs9BsMrRnIPwsUcofoxDb9QZ8-ehdjZhLcs2cE0w27DBvU68hnzfKi"}


    var msg = {
      FromUserName: data.ToUserName,
      ToUserName: data.FromUserName,
      //MsgType : 'text',
      Content: '嗯,图有坑?'
        //FuncFlag : 0
    };
    wechat.send(msg);
  });

  //监听地址信息
  wechat.location(function(data) {
    vlog.log('location data:%j', data);
    var msg = {
      FromUserName: data.ToUserName,
      ToUserName: data.FromUserName,
      //MsgType : 'text',
      Content: '嗯,坑地址.'
        //FuncFlag : 0
    };
    wechat.send(msg);
  });

  //监听链接信息
  wechat.link(function(data) {
    vlog.log('link data:%j', data);
    var msg = {
      FromUserName: data.ToUserName,
      ToUserName: data.FromUserName,
      //MsgType : 'text',
      Content: '嗯,坑link.'
        //FuncFlag : 0
    };
    wechat.send(msg);
  });

  //监听事件信息
  wechat.event(function(data) {
    vlog.log('event data:%j', data);

    //event data:{"ToUserName":"gh_a4d0dc565e2e","FromUserName":"oszWVxGVsA_0echDtb0isj908-ek",
    //"CreateTime":"1449395084","MsgType":"event","Event":"unsubscribe","EventKey":""}
    //
    //event data:{"ToUserName":"gh_a4d0dc565e2e","FromUserName":"oszWVxGVsA_0echDtb0isj908-ek",
    //"CreateTime":"1449395170","MsgType":"event","Event":"subscribe","EventKey":""}


    var msg = {
      FromUserName: data.ToUserName,
      ToUserName: data.FromUserName,
      //MsgType : 'text',
      Content: '嗯,坑事件.'
        //FuncFlag : 0
    };
    wechat.send(msg);
  });

  //监听语音信息
  //wechat.voice(function (data) { ... });

  //监听视频信息
  //wechat.video(function (data) { ... });

  //监听所有信息
  // wechat.all(function(data) {
  //   vlog.log('all data:%j', data);
  //   var msg = {
  //     FromUserName: data.ToUserName,
  //     ToUserName: data.FromUserName,
  //     //MsgType : 'text',
  //     Content: '嗯,all 坑.'
  //       //FuncFlag : 0
  //   };
  //   wechat.send(msg);
  // });
});

var start = function(newPort) {
  if (!newPort) {
    init(function(err,re) {
      if (err) {
        vlog.eo(err, 'start:init');
        return;
      }
      start(re.wxPort);
    });
    return;
  }else{
    port = newPort;
  }
  server.listen(port);
  vlog.log('wx started:%d', port);
};

exports.start = start;
