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



var printW = 1648;
var printH = 2354;
var printDpi = 96;

var tbW = 110;
var tbH = 140;

/**
 * 调整图片到合适的尺寸并保存
 * @param  {string}   srcPic   原文件位置
 * @param  {string}   destPic  目标文件位置
 * @param  {string}   targetW  目标宽
 * @param  {string}   targetH  目标高
 * @param  {Function} callback
 * @return {}
 */
var makePic = function(srcPic,destPic,targetW,targetH,callback) {
  var target = gm(srcPic);
  target.size(function (err, size) {
    if (err){
      return callback(vlog.ee(err,'resize size'));
    }
    var w = targetW;
    var h = targetH;
    if (size.width > size.height) {
      if (size.width/size.height > h/w) {
        h = null;
      }else{
        w = null;
      }
      target = target.rotate('white',90);
    }else{
      if (size.width/size.height > w/h) {
        w = null;
      }else{
        h = null;
      }
    }
    // vlog.log('w:%j,h:%j',w,h);
    target.gravity('Center').density(printDpi,printDpi).resize(w,h).crop(targetW, targetH).write(destPic, function(err) {
      if (err) {
        return callback(vlog.ee(err,'resize crop write'));
      }
      callback(null,'ok');
    });
  });
};

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
  var pr_picName = 'pr__' + picName;
  var dir = picDirPre + message.FromUserName + '/';


  try {
    fs.statSync(dir);
  } catch (e) {
    try {
      fs.mkdirSync(dir);
    } catch (e1) {
      return callback(vlog.ee(e1, 'mkdirSync'));
    }
  }
  download.download(message.PicUrl, dir, picName, function(err) {
    if (err) {
      return callback(vlog.ee(err, 'download'));
    }
    // vlog.log('download done:%j', re);
    gm(dir + picName).resizeExact(tbW, tbH).write(dir + tb_picName, function(err) {
      if (err) {
        vlog.eo(err, 'resize tb');
      }
      //在缩略图处理后再回复微信
      res.reply(reTxt);
    });
    //先处理完大图,再添加数据库
    makePic(dir + picName,dir+pr_picName,printW,printH,function(err) {
      if (err) {
        vlog.eo(err, 'makePic');
      }
      //保存图片URL到数据库
      db.userAddPic(message.FromUserName, picDownPre + message.FromUserName + '/' + tb_picName, message.MsgId, message.PicUrl, message.CreateTime, function(err) {
        if (err) {
          res.reply(errTxt);
          return callback(vlog.ee(err, 'handle. userAddPic:' + message));
        }
        callback(null, 'ok');
      });
    });
  });


};

exports.makePic = makePic;
exports.handle = handle;

// var testPic = '/Users/keel/Desktop/printbg.jpg';
// // testPic = '/Users/keel/Desktop/sms.png';
// var testPic2 = '/Users/keel/Desktop/pr__6229449922622219768_2.jpg';

// makePic(testPic,testPic2,printW,printH,function(err) {
//   if (err) {
//     vlog.eo(err, 'makePic');
//     return;
//   }
//   vlog.log('ok');
// });

// gm(testPic).size(function (err, size) {
//   if (err){
//     vlog.eo(err,'resize pr getsize');
//     return ;
//   }
//   var w = printW;
//   var h = printH;
//   if (size.width > size.height) {
//     if (size.width/size.height > h/w) {
//       h = null;
//     }else{
//       w = null;
//     }
//     gm(testPic).rotate('white',90).gravity('Center').density(printDpi,printDpi).resize(w,h).crop(printW, printH).write(testPic2, function(err) {
//       if (err) {
//         vlog.eo(err, 'resize pr');
//       }
//       vlog.log('ok');
//     });
//   }else{
//     if (size.width/size.height > w/h) {
//       w = null;
//     }else{
//       h = null;
//     }
//     gm(testPic).gravity('Center').density(printDpi,printDpi).resize(w,h).crop(printW, printH).write(testPic2, function(err) {
//       if (err) {
//         vlog.eo(err, 'resize pr');
//       }
//       vlog.log('ok');
//     });
//   }
// });



