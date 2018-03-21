var express  = require('express');
var router   = express.Router();
var path     = require("path");
var Mock     = require("mockjs");
var configs  = require("../config");
var iRequire = require("./lib/ismart.require");

router.get('/', function (req, res, next) {
    var file     = req.query.file;
    var filename = path.join(configs.APISERVER_PATH, file + ".js")
    var mockdata = iRequire(filename)
    res.jsonp(Mock.mock(mockdata));
});

module.exports = router;
