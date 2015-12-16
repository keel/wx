'use strict';

var express = require('express');
var app = express();
var port = 16000;
// var app = require('express').express();
var vlog = require('vlog').instance(__filename);
var wechat = require('./wechat');
var album = require('./album');
var albumre = require('./albumRedirect');


app.use(express.static(__dirname + '/public', {
  'maxAge': '1d'
}));


// app.use('/login', login.router);
// app.get('/logout', auth.logout);
app.use('/albumre', albumre.router);
app.use('/album', album.router);
app.use('/', wechat.wx);

app.use(function(err, req, res, next) {
  vlog.error(err.stack);
  res.status(500).send('500001');
});

var start = function() {

  app.listen(port, function(err) {
    if (err) {
      vlog.error(err.stack);
    }
    vlog.log('App start at:%d', port);
  });

};

exports.start = start;
