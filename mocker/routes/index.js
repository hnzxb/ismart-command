var configs = require("../config");
var express = require('express');
var router  = express.Router();
var glob    = require("glob");
var path    = require("path");

router.get('/', function (req, res, next) {
    
    var title = "数据结构"
    var data  = [];
    
    glob
        .sync(path.join(configs.APISERVER_PATH, "*.js"))
        .forEach(function (item) {
            if (/([^\/]+)\.js$/ig.test(item)) {
                data.push(RegExp.$1);
            }
        })
    
    res.render('index', {title, data});
});

module.exports = router;
