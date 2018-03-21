#! /usr/bin/env node
var path         = require("path");
var program      = require('commander');
var mockerServer = require('./mocker');
var docmaker     = require('./docmaker');
var http         = require('http');
var open         = require("opn");
var configs      = require("./mocker/config");

program
    .version('0.0.1')
    .usage('help')


program
    .command('mocker [dirname]')
    .description('部署一个APIMOCKER服务节点')
    .action(function (_dirname) {
        var dirname            = path.join(process.cwd(), _dirname||"./");
        configs.APISERVER_PATH = dirname;
        var port               = 3000;
        mockerServer.listen(port, function () {
            console.log('Deploying "%s"', dirname);
            open(`http://127.0.0.1:${port}/`)
        })
    });


program
    .command('doc:init')
    .option('-i, --skip [value]', '排除文档,支持glob模式')
    .option('-d, --dustdir [value]', '输出目录,相对当前目录')
    .description('通过注释自动创建接口文档')
    .action(function (_dirname) {
        docmaker.initConfig(process.cwd());
    });


program
    .command('doc')
    .option('-i, --skip [value]', '排除文档,支持glob模式')
    .option('-d, --dustdir [value]', '输出目录,相对当前目录')
    .description('通过注释自动创建接口文档')
    .action(function () {
        docmaker.Build(process.cwd());
    });


program.parse(process.argv);

