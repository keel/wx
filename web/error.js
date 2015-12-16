'use strict';
var err = {
  'params': '403001',
  'auth': '403002',
  'level': '403003',
  'server': '500',
  'db': '500002',
  'cache': '500003',
  'bindUser': '500004',
  '404': '404',
  'unknown': '500001'
};
var json = function(errorType, info) {
  var e = err[errorType] || err['unknown'];
  var re = '{"err":' + e;
  if (info) {
    re += ',"info":"' + info + '"';
  }
  re += '}';
  return re;
};

// var instance = function(fileName) {
//   return require('vlog').instance(fileName);
//   // var me = {};
//   // me.file = '[' + fileName.substring(fileName.lastIndexOf('/') + 1) + ']';
//   // me.ee = function(err, errMsg, errName) {
//   //   if (!err) {
//   //     err = new Error();
//   //   }
//   //   if (errName) {
//   //     err.name = errName;
//   //   }
//   //   errMsg = errMsg || '';
//   //   err.message = me.file + errMsg + ';' + err.message;
//   //   return err;
//   // };
//   // me.out = function(err, errMsg, errName) {
//   //   var e = me.ee(err, errMsg, errName);
//   //   vlog.error(e.stack);
//   //   return e;
//   // };
//   // return me;
// };


// exports.instance = instance;

exports.err = err;
exports.json = json;
