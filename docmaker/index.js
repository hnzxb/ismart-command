var glob            = require("glob");
var fs              = require("fs-extra");
var _               = require("lodash");
var path            = require("path");
var inquirer        = require('inquirer');
var stringifyObject = require('stringify-object');

var Maker = {
    config : {
        name       : "NO NAME",
        title      : "--NO TITLE--",
        version    : "0.1.0",
        git        : "",
        description: "--NO DESCRIPTION--",
        src        : "./",
        dust       : "./readme",
        skip       : "node_modules/**",
        source     : ''
    },
    results: {}
};


//==============
//获取配置文档
//==============
Maker.getConfig = function (dirname) {
    var config       = fs.readJSONSync(path.join(dirname, "./package.json")) || {};
    config.ismartdoc = config.ismartdoc || {src: "./src", out: "./readme", skip: "./node_modules/**"}
    return config;
}


Maker.initConfig = function (dirname) {
    var packs     = fs.readJSONSync(path.join(dirname, "./package.json")) || {};
    var questions = [
        {type: 'input', name: 'src', message: '请输入JS源文件路径', default: "./src"},
        {type: 'input', name: 'out', message: '请输入文档输出目录', default: "./readme"},
        {type: 'input', name: 'skip', message: '请输入过滤规则,支持glob', default: "./node_modules/**"}];
    
    return inquirer.prompt(questions)
        .then(function (result) {
            packs.ismartdoc = result;
            fs.outputJson(path.join(dirname, "./package.json"), packs)
                .then(function () {
                    console.log('package.json设置完成');
                })
                .catch(function (e) {
                    console.log(e.message);
                })
        })
}


//==============
//获取文档内容
//==============
Maker.getSingleData = function (text) { // 循环文件
    var matchs = text.match(/\/\*\*[^*][\s\S]*?\*\//g);
    if (!matchs) return;
    
    var
        singleResult = {items: []},
        singleName;
    
    matchs.forEach(function (match, i) {
        // 循环文件中的注释
        singleResult['items'][i - 1] = {params: []};
        match.replace(/@(name|grammar|param|params|return|example|more)\s+(?:\{(.*)\})?\s*([^@]*)|\/\*\*[*\s]+([^@]+)/gi, function ($0, $1, $2, $3, $4) {
            if ($1) { // 非描述信息
                $1 = $1.toLowerCase();
                $3 = $3.replace(/[\t ]*\*[\t ]?|(?:\s*\*[\s\/]*)*$/g, ''); // reg => 多行处理|去掉$3后面没用的
                if (i === 0) { // js文件顶部注释信息
                    if ($1 === 'name') { // name直接作为data的key存储此文件的内容
                        singleName = $3;
                    } else {
                        singleResult[$1] = $3;
                    }
                } else { // 非顶部注释
                    if ($1 === 'name' || $1 === 'grammar') { // name/grammar
                        singleResult['items'][i - 1][$1] = $3;
                    } else {
                        if ($1 === 'example' || $1 === 'more') { // example/more
                            singleResult['items'][i - 1][$1] = $3;
                        } else { // param/return
                            singleResult['items'][i - 1]['params'].push([$1, $2, $3]);
                        }
                    }
                }
            } else { // 描述
                $4 = $4.replace(/[\t ]*\*[\t ]?|(?:\s*\*[\s\/]*)*$/g, ''); // reg => 多行处理|去掉$3后面没用的
                if (i === 0) {
                    singleResult['desc'] = $4;
                } else {
                    singleResult['items'][i - 1]['desc'] = $4;
                }
            }
        })
    });
    
    if (singleName) Maker.results[singleName] = singleResult;
}


//==============
//获取文档信息
//==============
Maker.getFullData = function (srcDir, _skips) {
    var fileLists = glob.sync(srcDir);
    if (_skips) fileLists = _.difference(fileLists, glob.sync(path.join(_skips)))
    
    _.each(fileLists, function (item) {
        console.log(item, "...Done");
        Maker.getSingleData(fs.readFileSync(item, {encoding: 'utf8'}));
    })
    
    return Maker.results;
}

/*
 * 创建文件
 *
 * */

Maker.Build = function (dirname) {
    var config = Maker.getConfig(dirname);
    
    
    var srcDir  = path.join(dirname, config.ismartdoc.src, "**/*.js");
    var dustDir = path.join(dirname, config.ismartdoc.out || './readme');
    var skip    = config.ismartdoc.skip ? path.join(dirname, config.ismartdoc.skip || "./node_modules/**") : "";
    
    
    var result = Maker.getFullData(srcDir, skip);
    var templateHtml = fs.readFileSync(path.join(__dirname, 'template.html'), {encoding: 'utf8'});
    var BuildHtml    = _.template(templateHtml)({config: config, data: result});
    
    fs.ensureDirSync(path.join(dustDir, "./assets"));                               //创建文件夹
    fs.copySync(path.join(__dirname, "./assets"), path.join(dustDir, "./assets"))   //复制文件
    fs.outputFile(path.join(dustDir, "./index.html"), BuildHtml);
}

module.exports = Maker;
