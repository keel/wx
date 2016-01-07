/*
user.state:
0: 关注
-1: 取消关注
1: 已订购
2: 取消订购

TODO; 需要实现包月业务,在orderRelation表中增加state标签,或者建立新的包月订购关系表(更好的方式);
 */

'use strict';
var db = require('./../lib/db');
var cache = require('./../lib/cache');
var vlog = require('vlog').instance(__filename);
var userTable = 'wxUser';
// var albumTable = 'album';
var picTable = 'wxPic';
var orderTable = 'monthUser';

var orderProductID = ['135000000000000228468', '135000000000000230153'];

var pointMap = {};
pointMap[orderProductID[0]] = 20;
pointMap[orderProductID[1]] = 30;

var bindUser = function(openId, phone, callback) {
  db.findOneAndUpdate(userTable, {
      'openId': openId
    }, {
      '$set': {
        'phone': phone
      }
    }, {
      returnOriginal: false
    },
    function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'bindUser:' + openId + ',' + phone));
      }
      if (!re) {
        addUser(openId, null, phone, function(err, re) {
          if (err) {
            callback(vlog.ee(err, 'bindUser'));
            return;
          }
          callback(null, re);
        });
        return;
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
    'uid': uid,
    'state': {
      '$gte': 0
    }
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
    'state': 0,
    'createTime': createTime || (new Date()).getTime()
  };
  db.findOne(picTable, {
    '_id': id
  }, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'addPic.findOne'));
      return;
    }
    if (re) {
      vlog.error('pic already exsit:%j', re);
      callback('reSend');
    } else {
      db.insertOne(picTable, newPic, function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'addPic:' + uid + ',' + picUrl));
        }
        callback(null, re);
      });
    }
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
      addUser(openId, uid, null, function(err) {
        if (err) {
          //MSG重排导致的重发
          if (err === 'reSend') {
            return;
          }
          return callback(vlog.ee(err, 'userAddPic.addUser'));
        }
        addPic(uid, picUrl, picId, openId, wxUrl, createTime, callback);
      });
    } else {
      uid = re._id;
      addPic(uid, picUrl, picId, openId, wxUrl, createTime, callback);
    }
  });
};

var addUser = function(openId, uid, phone, callback) {
  var oid = uid || new db.OID();
  var now = (new Date()).getTime();
  var user = {
    '_id': oid,
    'openId': openId,
    'createTime': now,
    'state': 0,
    'phone': phone || '',
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

var addUserPoint = function(openId, addPoint, orderTime, callback) {
  var update = {
    '$inc': {
      'wxPoint': addPoint
    }
  };
  if (addPoint > 0) {
    update['$set'] = {
      'state': 1,
      'orderPoint': addPoint
    };
  }
  if (orderTime) {
    update['$set']['orderTime'] = orderTime;
  }
  db.update(userTable, {
    'openId': openId
  }, update, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'addUserPoint'));
      return;
    }
    callback(null, re);
  });
};

var unSubUser = function(openId, callback) {
  db.update(userTable, {
    'openId': openId
  }, {
    '$set': {
      state: -1
    }
  }, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'unSubUser'));
      return;
    }
    callback(null, re);
  });
};

var subUser = function(openId, callback) {
  findUser(openId, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'subUser'));
      return;
    }
    if (re) {
      db.update(userTable, {
        'openId': openId
      }, {
        '$set': {
          'state': 0
        }
      }, function(err, re) {
        if (err) {
          callback(vlog.ee(err, 'subUser.update'));
          return;
        }
        callback(null, re);
      });
    } else {
      addUser(openId, null, null, callback);
    }
  });
};

var checkOrder = function(phone, callback) {
  db.findOne(orderTable, {
    'productID': orderProductID[0],
    'phone': phone
  }, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'checkOrder'));
      return;
    }
    if (re) {
      callback(null, re, pointMap[orderProductID[0]]);
      return;
    }
    db.findOne(orderTable, {
      'productID': orderProductID[1],
      'phone': phone
    }, function(err, re1) {
      if (err) {
        callback(vlog.ee(err, 'checkOrder'));
        return;
      }
      callback(null, re1, pointMap[orderProductID[1]]);
    });
  });
};

var checkUserPics = function(openId, callback) {
  db.findOne(userTable, {
    'openId': openId
  }, function(err, user) {
    if (err) {
      return callback(vlog.ee(err, 'checkUser:' + openId));
    }
    if (user) {
      //这里使用user的id作为默认的albumId
      findPics(user._id, function(err, pics) {
        user.pics = pics;

        if ((user.state + '') === '0' && user.phone) {
          //查询绑定手机的账号是否订购,此时需要给用户加点
          checkOrder(user.phone, function(err, orderInfo, point) {
            if (err) {
              callback(vlog.ee(err, 'checkOrder'));
              return;
            }
            if (orderInfo && (orderInfo.state + '') === '0') {
              //订购成功,加点
              user.wxPoint += point;
              addUserPoint(user.openId, point, orderInfo.createTime, function(err) {
                if (err) {
                  vlog.eo(err, 'checkOrder.addUserPoint');
                }
                callback(null, user);
              });
            } else {
              callback(null, user);
            }
          });
        } else {
          callback(null, user);
        }

      });
    } else {
      addUser(openId, null, null, function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'checkUserPics.addUser'));
        }
        callback(null, re);
      });
    }
  });
};

var delPic = function(picId, callback) {
  db.update(picTable, {
    '_id': picId
  }, {
    '$set': {
      'state': -1
    }
  }, null, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'delPic'));
      return;
    }
    callback(null, re);
  });
};

var redisPrintTaskKeyPre = 'wx:printpics';

var addPrintPics = function(cypics, mid, callback) {
  var pics = cypics.substring(0, cypics.length - 1).split('-');
  // for (var i = 0; i < pics.length; i++) {
  //   pics[i] = pics[i].replace('tb__', '');
  // }
  db.pushToCache(redisPrintTaskKeyPre + ':' + mid, pics, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'pushToCache:' + cypics));
      return;
    }
    // vlog.log('push:%j,key:%j', pics, redisPrintTaskKeyPre + ':' + mid);
    //扣除点数
    db.findOne(picTable, {
      'url': pics[0]
    }, function(err, re) {
      if (err) {
        callback(vlog.ee(err, 'addPrintPics.findOne'));
        return;
      }
      addUserPoint(re.openId, -1 * pics.length, null, function(err, re) {
        if (err) {
          callback(vlog.ee(err, 'addPrintPics.addUserPoint'));
          return;
        }
        callback(null, re);
      });
    });
  });
};

var getPrintPic = function(mid, callback) {
  db.popFromCache(redisPrintTaskKeyPre + ':' + mid, function(err, re) {
    if (err) {
      callback(vlog.ee(err, 'popFromCache'));
      return;
    }
    if (!re) {
      return callback(null,re);
    }
    //检查图片是否已经入库,如未入库,则放回
    db.findOne(picTable, {
      'url': re
    }, function(err, pic) {
      if (err) {
        callback(vlog.ee(err, 'getPrintPic:findOne:'+re));
        return;
      }
      if (pic) {
        callback(null,re);
      } else {
        db.rPushToCache(redisPrintTaskKeyPre + ':' + mid, re, function(err, re) {
          if (err) {
            callback(vlog.ee(err, 'getPrintPic:pushToCache:' + re));
            return;
          }
          callback(null,null);
        });
      }
    });

  });
};


exports.bindUser = bindUser;
exports.addUser = addUser;
exports.addPic = addPic;
exports.findUser = findUser;
exports.checkUserPics = checkUserPics;
exports.findPics = findPics;
exports.userAddPic = userAddPic;
exports.delPic = delPic;
exports.addPrintPics = addPrintPics;
exports.getPrintPic = getPrintPic;
exports.subUser = subUser;
exports.unSubUser = unSubUser;


// var pp = 'http://kf.loyoo.co/wxpics/og7V4wHtmgMSb6fTrUQ4xJheErBo/tb__6229194685600710599.jpg-http://kf.loyoo.co/wxpics/og7V4wHtmgMSb6fTrUQ4xJheErBo/tb__6229194591111430077.jpg';
// var mm = 23;
// addPrintPics(pp,mm,function(err, re) {
//   if (err) {
//     vlog.eo(err); return;
//   }
//   vlog.log('add re:%j',re);

// });
// getPrintPic(mm, function(err, re) {
//   if (err) {
//     vlog.eo(err);
//     return;
//   }
//   vlog.log('pop re:%j', re);
// });

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
