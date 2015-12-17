/*
处理微信图片信息
 */
'use strict';


var vlog = require('vlog').instance(__filename);
// var ktool = require('ktool');
var download = require('./../lib/download');
var fs = require('fs');
var db = require('./dbweb');
var gm = require('gm');
var picDirPre = '/data/apps/pics/';
var picDownPre = 'http://kf.loyoo.co/wxpics/';
var albumUrl = 'http://kf.loyoo.co/wxt/albumre';
var reTxt = '<a href="' + albumUrl + '">您已成功上传一张照片至相册,点击本消息查看.</a>';
var errTxt = '本次照片上传失败,请稍后再试,谢谢.';

var handle = function(message, req, res, callback) {

  // message为图片内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359124971',
  // MsgType: 'image',
  // PicUrl: 'http://mmsns.qpic.cn/mmsns/bfc815ygvIWcaaZlEXJV7NzhmA3Y2fc4eBOxLjpPI60Q1Q6ibYicwg/0',
  // MediaId: 'media_id',
  // MsgId: '5837397301622104395' }
  // vlog.log('msg:%j', message);
  //先保存图片到本地目录,通过nginx可以访问到
  var picName = message.MsgId + '.jpg';
  var tb_picName = 'tb__' + picName;
  var dir = picDirPre + message.FromUserName + '/';
  //保存图片URL到数据库
  db.userAddPic(message.FromUserName, picDownPre + message.FromUserName + '/' + tb_picName, message.MsgId, message.PicUrl, message.CreateTime, function(err) {
    if (err) {
      res.reply(errTxt);
      return callback(vlog.ee(err, 'handle. userAddPic:' + message));
    }
    //回复链接
    res.reply(reTxt);
    try {
      fs.statSync(dir);
    } catch (e) {
      try {
        fs.mkdirSync(dir);
      } catch (e1) {
        return callback(vlog.ee(e1, 'mkdirSync'));
      }
    }
    download.download(message.PicUrl, dir, picName, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'download'));
      }
      // vlog.log('download done:%j', re);
      gm(dir + picName).resize(110, 140, '!').write(dir + tb_picName, function(err) {
        if (err) {
          return callback(vlog.ee(err, 'resize'));
        }
      });
      callback(null, 'ok');
    });
  });
};


exports.handle = handle;
