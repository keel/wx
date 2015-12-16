/*
处理微信图片信息
 */
'use strict';


var vlog = require('vlog').instance(__filename);
var ktool = require('ktool');
var download = require('./../lib/download');

var picDir = '/data/apps/pics/';

var handle = function(message, req, res, callback) {

  // message为图片内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359124971',
  // MsgType: 'image',
  // PicUrl: 'http://mmsns.qpic.cn/mmsns/bfc815ygvIWcaaZlEXJV7NzhmA3Y2fc4eBOxLjpPI60Q1Q6ibYicwg/0',
  // MediaId: 'media_id',
  // MsgId: '5837397301622104395' }

  //先保存图片到本地目录,通过nginx可以访问到
  var picName =ktool.randomStr(15)+'.jpg';
  download.download(message.PicUrl,picDir,picName,function (err,re) {
    if (err) {
      vlog.error(err);
    }
    vlog.log('download done:%j',re);
  });
  //保存图片URL到数据库
  //回复链接

  res.reply('图来了!');
};

exports.handle = handle;