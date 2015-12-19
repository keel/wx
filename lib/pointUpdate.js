/*
每月开始时刷新订购状态用户的点数,这里使用数库保存刷新记录
 */
'use strict';
var db = require('./db');
var vlog = require('vlog').instance(__filename);

