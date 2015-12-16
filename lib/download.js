'use strict';
var fs = require('fs');
var url = require('url');
var http = require('http');
var vlog = require('vlog').instance(__filename);


/**
 * 下载文件到指定目录
 * @param  {string}   httpUrl
 * @param  {string}   dir
 * @param  {string}   [fileName]
 * @param  {Function} callback
 * @return {}
 */
var download = function(httpUrl, dir, fileName, callback) {
  var urlObj = url.parse(httpUrl);
  // var options = {
  //   host: urlObj.host,
  //   port: urlObj.port,
  //   path: urlObj.pathname
  // };
  // vlog.log('urlObj:%j',urlObj);
  var fName = fileName || urlObj.pathname.split('/').pop();
  var file = fs.createWriteStream(dir + fName);
  http.get(httpUrl, function(res) {
    if (res.statusCode !== 200 ) {
      file.end();
      if (callback) {
        callback(vlog.ee(null,'get http status:'+res.statusCode));
      }
      return;
    }
    res.on('data', function(data) {
      file.write(data);
    }).on('end', function() {
      file.end();
      if (callback) {
        callback(null, fName);
      }
    });
  }).on('error', function(err) {
    file.end();
    if (callback) {
      return callback(vlog.ee(err, 'download'));
    }
  });
};


exports.download = download;

// download('http://58.223.2.136/images/bk_dark_line.png', '/Users/keel/dev/', null, function(err, re) {
//   if (err) {
//     return vlog.error(err);
//   }
//   vlog.log('download done:%j', re);
// });
