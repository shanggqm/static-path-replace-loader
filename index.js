'use strict';

var loaderUtils = require('loader-utils');

//检查指定文件源码中是否包含了常见的html资源路径
//<img|embed|audio|video|link|object ... src="path"/>
//<script|style ... src="path"></script|style>          外链
//<script|style ...>...</script|style>                  内联
//文本中匹配外链JS脚本
var JS_OUT_LINK_REG = /<script(?:(?=\s)[^<>]*?src\s*?\=\s*?['"])([^<>]*?)['"]([\s\S]*?)>([\s\S]*?)(?=<\/script\s*>|$)/ig;
//匹配HTML中除了script标签以外的其他外链资源
var HTML_OUT_LINK_REG = /<(img|embed|audio|video|link|object)\s+[^<>]*?(?:(src|href))\s*?\=\s*?('([^<>]*?)'|"([^<>]*?)")[\s\S]*?>/ig;

var toUrlPath = function(targetUrl, rpath) {
    targetUrl = targetUrl.replace(/(\/|\\)*$/, '');
    rpath = rpath.replace(/^(\/|\\)*/, '');
    return targetUrl + '/' + rpath;
};

var isAbsolutePath = function(content) {
    return /^(http[s]?|\w\:|data\:)/.test(content);
};

var toTargetPath = function(content, placeholder, targetUrl, excludeSyntax) {
    //如果检测到是绝对地址，则默认不做修改
    if (isAbsolutePath(content)) {
        return content;
    }

    //需要排除掉的模板语法动态内容
    excludeSyntax = excludeSyntax || [];
    var tobeExcluded = false;
    excludeSyntax.forEach(function(s) {
        var reg = new RegExp(s);
        // console.log('------excludesyntax---------', content);
        if (reg.test(content)) {
            // console.log('------excludesyntax test true---------skiped');
            tobeExcluded = true;
            return false;
        }
    });

    if (tobeExcluded) {
        return content;
    }

    //相对地址
    //如果传入了占位符，则需要根据占位符进行替换
    if (placeholder) {
        return toUrlPath(targetUrl , content.replace(placeholder, ''));
    }
    //如果没有传占位符，则默认拼接
    return toUrlPath(targetUrl, content);
};

module.exports = function(source) {
    var query = loaderUtils.parseQuery(this.query);
    if (this.cacheable) {
        this.cacheable();
    }

    //匹配script、link、style、video、audio、embed的src或href属性
    // baseUrl，最终要替换的路径
    var baseUrl = query.baseUrl;
    if (!baseUrl) {
        console.warn('static-path-replace-loader need a [baseUrl] param current is null!');
        return source;
    }

    //路径的占位，有时候会在tpl模板或者js文件里写html结构，比如var img = '<img src="{{base_url}}/asset/img/a.png">'
    var placeholder = query.placeholder;
    //要屏蔽掉的模板中的语法，比如有些地方使用了mustache的语法<img src="{{imageUrl}}"/>，那显然，这个地方使用的是动态的url，不能替换
    var excludeSyntax = query.excludeSyntax;

    source = source.replace(JS_OUT_LINK_REG, function(x, $1) {
        // console.log('->')
        // console.log('---------------js matched----x:', x)
        // console.log('---------------js matched----1:', $1)
        var result = x.replace($1, toTargetPath($1, placeholder, baseUrl, excludeSyntax));
        // console.log('---------------js matched----result:', result)
        return result;
    });

    source = source.replace(HTML_OUT_LINK_REG, function(x, $1, $2, $3, $4, $5) {
        // console.log('->')
        // console.log('---------------html matched----x:', x)
        // console.log('---------------html matched----1:', $1)
        // console.log('---------------html matched----2:', $2)
        // console.log('---------------html matched----3:', $3)
        // console.log('---------------html matched----4:', $4)
        // console.log('---------------html matched----5:', $5)
        $4 = $4 || $5;
        var result = x.replace($4 , toTargetPath($4, placeholder, baseUrl, excludeSyntax));
        // console.log('---------------js matched----result:', result)
        return result;
    });

    return source;
};
