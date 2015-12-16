'use strict';
var db = require('./../lib/db');
// var cache = require('/../lib/cache');
var vlog = require('vlog').instance(__filename);
var userTable = 'wxUser';
// var albumTable = 'album';
var picTable = 'pic';

var bindUser = function(openId, phone, point, callback) {
  db.findOneAndUpdate(userTable, {
      'openId': openId
    }, {
      '$set': {
        'phone': phone
      },
      '$inc': {
        'wxPoint': point
      }
    }, {
      returnOriginal: false
    },
    function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'bindUser:' + openId + ',' + phone));
      }
      callback(null, re);
    });
};

var findUser = function(openId, callback) {
  db.findOne(userTable, {
    'openId': openId
  }, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'findUser:' + openId));
    }
    callback(null, re);
  });
};

var findPics = function(uid, callback) {
  db.query(picTable, {
    'uid': uid
  }, {
    'createTime': -1
  }, 0, 50, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'findPics:' + uid));
    }
    callback(null, re);
  });
};

var addPic = function(uid, picUrl, picId, openId, wxUrl, createTime, callback) {
  var id = picId || new db.OID();
  var newPic = {
    '_id': id,
    'uid': uid,
    'url': picUrl,
    'openId': openId || '',
    'wxUrl': wxUrl || '',
    'createTime': createTime || (new Date()).getTime()
  };
  db.insertOne(picTable, newPic, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'addPic:' + uid + ',' + picUrl));
    }
    callback(null, re);
  });
};

var userAddPic = function(openId, picUrl, picId, wxUrl, createTime, callback) {
  db.findOne(userTable, {
    'openId': openId
  }, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'userAddPic.findUser:' + openId));
    }
    var uid = null;
    if (!re) {
      uid = new db.OID();
      addUser(openId, uid, function(err) {
        if (err) {
          return callback(vlog.ee(err, 'userAddPic.addUser'));
        }
      });
    }
    uid = re._id;
    addPic(uid, picUrl, picId, openId, wxUrl, createTime, callback);
  });
};

var addUser = function(openId, uid, callback) {
  var oid = uid || new db.OID();
  var now = (new Date()).getTime();
  var user = {
    '_id': oid,
    'openId': openId,
    'createTime': now,
    'state': 0,
    'phone': '',
    'orderTime': 0,
    'exitTime': 0,
    'wxPoint': 3
      // 'albums':[oid]
  };

  db.insertOne(userTable, user, function(err) {
    if (err) {
      return callback(vlog.ee(err, 'addUser'));
    }
    callback(null, user);
  });
};

var checkUserPics = function(openId, callback) {
  db.findOne(userTable, {
    'openId': openId
  }, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'checkUser:' + openId));
    }
    if (re) {
      //这里使用user的id作为默认的albumId
      findPics(re._id, function(err, pics) {
        re.pics = pics;
        callback(null, re);
      });
    } else {
      addUser(openId, null, function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'checkUserPics.addUser'));
        }
        callback(null, re);
      });
    }
  });
};


exports.bindUser = bindUser;
exports.addUser = addUser;
exports.addPic = addPic;
exports.findUser = findUser;
exports.checkUserPics = checkUserPics;
exports.findPics = findPics;
exports.userAddPic = userAddPic;

// var id = '5670011f19ba08ac03c082dc';

// vlog.log(new Date().getTime());
// vlog.log(require('ktool').randomStr(64,'0123456789'));

// findPics('5670011f19ba08ac03c082dc',function (err,re) {
//   if (err) {
//     return vlog.ee(err);
//   }
//   vlog.log('re:%j',re);
// });

// addPic(id,'http://testurl2',function (err,re) {
//   if (err) {
//     return vlog.ee(err);
//   }
//   vlog.log('re:%j',re);
// });

// bindUser('testOpen','15301588025',20,function (err,re) {
//   if (err) {
//     return vlog.ee(err);
//   }
//   vlog.log('re:%j',re);
// });
