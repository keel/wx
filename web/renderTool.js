'use strict';
require('dot').process({global: '_page.render', destination: __dirname + '/render/', path: (__dirname + '/tpls') });
var render = require('./render');
module.exports = render;