/*
数据库操作
 */

'use strict';
var mongo = require('mongodb').MongoClient;
var vlog = require('vlog').instance(__filename);
var cache = require('./cache');
var db;
var colls = {};
var dbName = 'lysms';
var mongoUrl = 'mongodb://keel:jsLy_0107@127.0.0.1:27017/lysms';
var OID = require('mongodb').ObjectID;

var initDB = function(callback) {

  if (db) {
    if (!mongo) {
      vlog.error('mongo is null! will rebuild it.');
      mongo = require('mongodb').MongoClient;
      db = null;
      init(callback);
      return;
    }
    // mongo.close(function(err,re) {
    //   if (err) {
    //     vlog.eo(err);
    //     callback('mongo close error');
    //     return;
    //   }
    //   db = null;
    //   // coll = null;
    //   vlog.log('mongo closed');
    //   init(callback);
    //   return;
    // });
    // return;
  }
  mongo.connect(mongoUrl, function(err, database) {
    // assert.equal(null, err);
    if (err) {
      // vlog.eo(err,'initDB:connect');
      callback(vlog.ee(new Error('db'), 'initDB:connect:' + mongoUrl + ',' + dbName));
      return;
    }
    db = database;
    if (db) {
      db.stats(function(err, stats) {
        if (err) {
          vlog.eo(err, 'initDB:db.stats');
          callback(vlog.ee(new Error('db'), 'initDB:mongo connected but db stats error.' + stats));
          return;
        }
        vlog.log('mongo stats:%j', stats);
        if (!stats || stats.ok !== 1) {
          vlog.error('mongo stats error %j', stats);
          callback(vlog.ee(new Error('db'), 'initDB:mongo stats error:' + stats));
          return;
        }
        vlog.log('mongo inited OK.');
        callback(null, 'ok');
      });
    }
  });

};


var init = function(callback) {
  var configArr = ['dbName', 'mongoUrl'];
  cache.readConfig(configArr, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'init', 'readConfig'));
    }
    dbName = re.dbName;
    mongoUrl = re.mongoUrl;
    initDB(callback);
  });

};



var checkColl = function(name, callback) {
  var cl = colls[name];
  if (!cl) {
    if (!db) {
      init(function(err) {
        if (err) {
          return callback(vlog.ee(err, 'checkColl:init'));
        }
        db.collection(name, function(err, coll) {
          if (err) {
            callback(vlog.ee(err, 'checkColl:init:2'));
            return;
          }
          callback(null, coll);
          colls[name] = coll;
        });
      });
    } else {
      db.collection(name, function(err, coll) {
        if (err) {
          callback(vlog.ee(err, 'checkColl:3'));
          return;
        }
        callback(null, coll);
        colls[name] = coll;
      });
    }
  } else {
    callback(null, cl);
  }
};



var mapReduce = function(tableName, map, reduce, options, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'mapReduce:1'));
    }
    coll.mapReduce(map, reduce, options, function(err, re, stats) {
      if (err) {
        return callback(vlog.ee(err, 'mapReduce:2'));
      }
      callback(null, re, stats);
    });
  });
};



var query = function(tableName, query, sort, skip, limit, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'find:checkColl:' + tableName));
    }
    // vlog.log('query:%j',query);
    coll.find(query).sort(sort).skip(skip).limit(limit).toArray(function(err, dbObj) {
      if (err) {
        return callback(vlog.ee(err, 'find:findOne:' + JSON.stringify(query)));
      }
      return callback(null, dbObj);
    });
  });
};
var findOne = function(tableName, query, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'find:checkColl:' + tableName));
    }
    // vlog.log('query:%j',query);
    coll.find(query).limit(1).next(function(err, dbObj) {
      if (err) {
        return callback(vlog.ee(err, 'find:findOne:' + JSON.stringify(query)));
      }
      return callback(null, dbObj);
    });
  });
};

var insertOne = function(tableName, dbObj, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'insertOne:checkColl:' + tableName));
    }
    coll.insertOne(dbObj, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'insertOne:insertOne:' + JSON.stringify(dbObj)));
      }
      return callback(null, re);
    });
  });
};

var popFromDb = function(tableName, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'popFromDb:checkColl:' + tableName));
    }
    coll.findOneAndDelete(tableName, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'popFromDb:findOneAndDelete:' + tableName));
      }
      return callback(null, re.value);
    });
  });
};
var pushToDb = function(tableName, obj, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'pushToDb:checkColl:' + tableName));
    }
    coll.insertOne(obj, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'pushToDb:insertOne:' + tableName + ',' + JSON.stringify(obj)));
      }
      return callback(null, re);
    });
  });
};

var findOneAndUpdate = function(tableName, query, updateMap, options, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'findOneAndUpdate:checkColl:' + tableName));
    }
    coll.findOneAndUpdate(query, updateMap, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'findOneAndUpdate:findOneAndUpdate:' + JSON.stringify(query) + ',' + JSON.stringify(updateMap)));
      }
      return callback(null, re);
    });
  });
};

//注意是updateMany
var update = function(tableName, query, updateMap, options, callback) {
  //更新db
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'update:checkColl:' + tableName));
    }
    coll.updateMany(query, updateMap, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'update:updateMany:' + JSON.stringify(query) + ',' + JSON.stringify(updateMap)));
      }
      return callback(null, re);
    });
  });
};

var deleteOne = function(tableName, cacheKey, keyMap, callback) {
  //先更新db,再刷新cache
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'deleteOne:checkColl:' + tableName));
    }
    coll.deleteOne(keyMap, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'deleteOne:deleteOne:' + JSON.stringify(keyMap)));
      }

      return callback(null, re);

    });
  });
};


var popFromCache = function(key, callback) {
  cache.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'popFromCache:checkClient:' + key));
    }
    client.rpop(key, function(err, doc) {
      if (err) {
        return callback(vlog.ee(err, 'popFromCache:rpop:' + key));
      }
      // var value = JSON.parse(doc);
      return callback(null, doc);
    });

  });
};
var pushToCache = function(key, value, callback) {
  cache.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'pushToCache:checkClient:' + key + ',' + JSON.stringify(value)));
    }
    // var value = JSON.stringify(obj);
    client.lpush(key, value, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'pushToCache:lpush:' + key + ',' + value));
      }
      return callback(null, re);
    });

  });
};
exports.init = init;
exports.findOne = findOne;
exports.query = query;
exports.update = update;
exports.findOneAndUpdate = findOneAndUpdate;
exports.insertOne = insertOne;
exports.deleteOne = deleteOne;
exports.pushToDb = pushToDb;
exports.popFromDb = popFromDb;
exports.mapReduce = mapReduce;
exports.checkColl = checkColl;
exports.OID = OID;
exports.pushToCache = pushToCache;
exports.popFromCache = popFromCache;

// popFromCache('testMutiPush',function(err, re) {
//   if (err) {
//     vlog.eo(err, 'popFromCache'); return;
//   }
//   vlog.log('re:%j',re);
// });
// pushToCache('testMutiPush',['a1','a2'],function(err, re) {
//   if (err) {
//     vlog.eo(err, 'pushToCache'); return;
//   }
//   vlog.log('ok');
// });

// var obj = {
//   type: 2,
//   phNum: '15301588025',
//   info: 'test info'
// };

// var tb = 'testTable';


// query(tb, {}, {_id:-1}, 0, 20, function(err, re) {
//   if (err) {
//     vlog.error(err);
//     return;
//   }
//   vlog.log('re:%j', re);
// });

// var oid = new OID();
// vlog.log('oid:%j,time:%j',oid,oid.getTimestamp().toString());

// insertOne(tb, obj, function(err, re) {
//   if (err) {
//     vlog.error(err);
//   }
//   vlog.log('re:%j', re);
// });

// findOne(tb, {
//   type: 3
// }, function(err, re) {
//   if (err) {
//     vlog.error(err);
//   }
//   vlog.log('re:%j', re);
// });
