'use strict';
var qs = require('querystring');
var cache = require('./cacheWeb');
var enc2 = require('./enc2web');
var error = require('./error');

var vlog = require('vlog').instance(__filename);
var sessionPre = 'sid:';
var expireTime = 60 * 30;

var fail = function(req, resp) {
  resp.clearCookie('c');
  resp.redirect('/login');
  resp.end();
  return;
};
var failResp = function(req, resp) {
  resp.clearCookie('c');
  resp.status(403).send(error.json('auth'));
  resp.end();
  return;
};


var sessionSet = function(resp,sid,value,expireTime,callback) {
  cache.set(sessionPre+sid, value, expireTime, function(err) {
    if (err) {
      return callback(vlog.ee(err,'sessionSet err:'+sid+',value:'+value));
    }
    //设置cookie
    resp.cookie('c', sid, {
      maxAge: (expireTime * 1000),
      httpOnly: true
    });
    callback(null, 'ok');
  });
};

var setAuthed = function(req, resp, userId, level, callback) {
  var now = new Date().getTime();
  var sessionSrc = now + '_' + userId + '_' + level + '_' + req.ip;
  // vlog.log('sessionSrc:%s',sessionSrc);
  var sessionId = enc2.enc(sessionSrc);
  // vlog.log('sessionId:%s',sessionId);
  sessionSet(resp,sessionId, sessionSrc, expireTime, callback);
};


var updateAuthed = function(req, resp, sid, sessionArr, callback) {
  // if (!sid) {
  //   return callback(vlog.ee(null, 'sid is null'));
  // }
  sessionArr[0] = (new Date()).getTime();
  var newSrc = sessionArr.join('_');

  sessionSet(resp,sid, newSrc, expireTime, callback);

};

var logout = function(req, resp) {
  var kie = req.get('cookie');
  if (!kie) {
    return fail(req, resp);
  }
  var c = qs.parse(kie).c;
  // vlog.log('c:%j',c);
  if (!c) {
    return fail(req, resp);
  }
  cache.get(sessionPre + c, function(err, re) {
    if (err) {
      vlog.error(err.stack);
      return fail(req, resp);
    }
    if (!re) {
      return fail(req, resp);
    }
    cache.del(sessionPre + c, function(err) {
      if (err) {
        vlog.error(err.stack);
      }
      return fail(req, resp);
    });

  });
};


var check = function(req, resp, failFn, next) {
  var kie = req.get('cookie');
  if (!kie) {
    return failFn(req, resp);
  }
  var c = qs.parse(kie).c;
  // vlog.log('c:%j',c);
  if (!c) {
    return failFn(req, resp);
  }
  cache.get(sessionPre + c, function(err, re) {
    if (err) {
      vlog.error(err.stack);
      return failFn(req, resp);
    }
    if (!re) {
      return failFn(req, resp);
    }
    var sessionArr = re.split('_');
    if (sessionArr.length < 4) {
      vlog.eo(null, 'sessionArr err:' + re);
      return failFn(req, resp, next);
    }
    if (sessionArr[3] !== req.ip) {
      return failFn(req, resp, next);
    }
    updateAuthed(req, resp, c, sessionArr, function(err) {
      if (err) {
        vlog.eo(err, 'check error.');
      }

      req.userId = sessionArr[1];
      req.userLevel = sessionArr[2];
      // vlog.log('set req level:%j',req.userLevel);
      next();
    });


    // var dec = enc2.dec(c);
    // // vlog.log('dec:%j',dec);
    // if (!dec) {
    //   vlog.error('cookieCheck dec error, c:%s', c);
    //   return failFn(req, resp);
    // }
    // var respArr = dec.split('_');
    // if (respArr[2] !== req.ip) {
    //   return failFn(req, resp);
    // }
    // setAuthed(req, resp, respArr[0], respArr[1], function(err, re) {
    //   if (err) {
    //     vlog.error(err.stack);
    //     return failFn(req, resp);
    //   }
    //   req.userId = respArr[0];
    //   req.userLevel = respArr[1];
    //   // vlog.log('set req level:%j',req.userLevel);
    //   next();
    // });
  });
};

var cookieCheck = function(req, resp, next) {
  check(req, resp, fail, next);
};

var cookieCheckResp = function(req, resp, next) {
  check(req, resp, failResp, next);
};
exports.cookieCheck = cookieCheck;
exports.cookieCheckResp = cookieCheckResp;
exports.setAuthed = setAuthed;
exports.logout = logout;
