'use strict';

var fs = require('fs');
var redis = require('redis');
var redisClient = null;

var vlog = require('vlog').instance(__filename);
// var db = require('./db');

//redis保存config的前缀
var configKeyPre = 'config:';
var configFile = __dirname + '/../config.json';


/**
 * 初始化，以redis数据为准redis无法连接时使用config.json的数据
 * @param {map} configMap 由config.json读出的配置，如果有此参数则直接使用此参数，不再读config.json
 * @param  {Function} callback
 * @return {}
 */
var init = function(configMap, callback) {
  //先读本地配置，取redis地址
  if (redisClient) {
    redisClient.quit();
  }
  var json = null;
  if (configMap && configMap.redisIP && configMap.redisPort) {
    json = configMap;
  } else {
    var configStr = fs.readFileSync(configFile, 'utf-8');
    if (!configStr) {
      callback(vlog.ee(new Error('init'), 'read config.json failed.'));
      return;
    }
    json = JSON.parse(configStr);
  }
  if (json) {
    var redisIP = json.redisIP;
    var redisPort = json.redisPort;
    if (redisIP && redisPort) {
      redisClient = redis.createClient(redisPort, redisIP, {
        max_attempts: 1
      });
      redisClient.on('error', function(err) {
        vlog.eo(new Error('init'), 'redis init err');
        redisClient = null;
        callback(vlog.ee(err, 'init'));
        return;
      });
      redisClient.on('connect', function() {
        vlog.log('redis inited OK:[%s] [%d]', redisIP, redisPort);
        callback(null, 'ok');
        return;
      });
    } else {
      callback(vlog.ee(new Error('init'), 'redis read ip and port from config.json failed.'));
    }
  } else {
    callback(vlog.ee(new Error('init'), 'redis read config.json failed.'));
  }
};

/**
 * 读取配置，先从本地config.json读取，再从redis中刷新最新配置,如果redis无法连接，不报错直接返回本地配置
 * @param  {Array}   keyArr   需要的配置key值
 * @param  {Function} callback
 */
var readConfig = function(keyArr, callback) {
  if (!keyArr || keyArr.length <= 0) {
    return callback(vlog.ee(new Error('readConfig'), 'keyArr is empty'));
  }
  var outMap = {};
  var configStr = fs.readFileSync(configFile, 'utf-8');
  if (!configStr) {
    callback(vlog.ee(new Error('readConfig'), 'read config.json failed.'));
    return;
  }
  var json = JSON.parse(configStr);
  if (json) {
    readRedisConfig(json, function(err, re) {
      if (err) {
        vlog.eo(err, 'readConfig:redis config read failed,will use config.json instead.');
        return callback(null, json);
      }
      for (var i = 0; i < keyArr.length; i++) {
        outMap[keyArr[i]] = re[keyArr[i]];
      }
      callback(null, outMap);
      return;
    });
  } else {
    callback('read config.json failed.');
  }
};

var checkClient = function(callback) {
  if (!redisClient) {
    init(null, function(err) {
      if (err) {
        callback(vlog.ee(err, 'checkClient'));
        return;
      } else {
        callback(null, redisClient);
      }
    });
  } else {
    callback(null, redisClient);
  }
};

/**
 * 读取redis配置,如果此配置在redis中不存在则将默认配置保存到redis中
 * @param  {object}   configMap 有默认值的配置map,一般从本地config.json中读取
 * @param  {Function} callback
 */
var readRedisConfig = function(configMap, callback) {
  if (!configMap) {
    callback(vlog.ee(new Error('readRedisConfig'), 'readRedisConfig configMap is empty.'));
    return;
  }
  if (!redisClient) {
    init(configMap, function(err) {
      if (err) {
        callback(vlog.ee(err, 'readRedisConfig redis init failed'));
        return;
      } else {
        readRedisConfig(configMap, callback);
      }
    });
    return;
  }
  var sum = 0;
  for (var i in configMap) {
    i += '';
    sum++;
  }
  var haveRead = 0;
  var finish = function(readCount, key, value) {
    if (readCount <= 0) {
      //redis没有此配置，存入默认值
      vlog.warn('redis have no config [%s]:[%s], will save it to redis.', key, value);
      redisClient.set(configKeyPre + key, value);
      haveRead++;
    } else {
      haveRead = haveRead + readCount;
      configMap[key] = value;
    }
    //所有配置更新完后进行回调
    if (haveRead >= sum) {
      callback(null, configMap);
    }

  };

  var getOne = function(key, oldValue) {
    redisClient.get(configKeyPre + key, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'getOne:redis get one err.'));
      }
      // vlog.log('redis re:%j',re);
      if (re) {
        finish(1, key, re);
      } else {
        finish(0, key, oldValue);
      }
    });
  };
  for (var j in configMap) {
    getOne(j, configMap[j]);
  }
};



exports.init = init;
exports.readRedisConfig = readRedisConfig;
exports.readConfig = readConfig;
exports.checkClient = checkClient;

// var map = {'testConfig':'tttt3','testConf':2323,'test3':'neweee'};
// readRedisConfig(map,function (err,re) {
// 	if (err) {
// 		vlog.error(err,err.stack);
// 		return;
// 	}
// 	vlog.log('new config:%j',re);
// });
