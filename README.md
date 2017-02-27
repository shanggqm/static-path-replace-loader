## static-path-replace-loader
### 介绍
webpack构建体系下，要实现前后端分离上线，需要解决不同环境下静态资源的url指向的域名不同的问题。比如在tpl模板文件中存在三种类型的静态资源引用：

```html
<link href="/asset/css/main.css"/>
<img src="/asset/image/logo.png"/>
<script src="/js/a.js"></script>
```

而在qa和线上环境，图片通常被部署在不同的域名下：

```html
<!-- qa env-->
<link href="http://qa.appname.com/asset/css/main.css"/>
<img src="http://qa.appname.com/asset/image/logo.png"/>
<script src="http://qa.appname.com/js/a.js"></script>

<!-- product env-->
<link href="http://appname.com/asset/css/main.css"/>
<img src="http://appname.com/asset/image/logo.png"/>
<script src="http://appname.com/js/a.js"></script>
```

因此，需要在webpack构建时对图片的路径进行转换。对于一个SPA架构的前端系统，通常我们会在两类文件中书写静态资源引用的代码：JS和模板文件。这两类文件的处理方式是相似的，这里主要要考虑到两类系统的场景。

#### 全新系统
对于一个全新法的系统，我们可以指定一个统一的编码规范来约束静态资源路径的写，比如js里的图片只能通过require来引用，这样就可以完全交由webp来处理publicPath的替换：

```javascript
const logo = require('./asset/image/logo.png');

const tpl = `<img src="${logo}" />`;

//在webpack.config.js中的output配置里根据不同环境指定不同的publicPath值即可在执行不同环境的构建脚本时自动替换路径

```
#### 遗留系统
对于遗留系统，可能会存在很多不规范的写法，比如字符串拼接的方式等，
```js
var html = '<div><img src="'+base_url+'/asset/image/logo.png"/></div>';
```
实际的情况可能要复杂的多。而复杂重要的系统通常又不会允许全面的重构改写，这样会入新的测试成本和风险。static-path-replace-loader通过正则匹配的方式来适配大多数js里的静态资源引用方式，来实现无需重构代码就可以实现静态资源路径的替换。虽然无法降低测试的成本，
但至少本可以规避人工修改带来的时间成和出错风险。

不过仍然建议遗留系统通过定义资源引用的规范来提高维护的成本，可以参见上述介绍。

### 安装

```sh
$ npm i static-path-replace-holder --save-dev
```

### 使用
配置webpack.config.js
```javascript
var env = process.ENV;
var publicPath = '/dist/';

if(env === 'qa'){
	publicPath = 'http://qa.appname.com/dist/';
}else if(env === 'production'){
	publicPath = 'http://appname.com/dist/';
}

//...
output: {
	publicPath: publicPath
	//...
},
//...
module: {
	loaders: [{
		test: /\.(js|html|tpl)$/i,
		loader: 'static-path-replace-loader',
		query:{
			baseUrl: publicPath,		
			placeholder: '{%__BASE_URL__%}',		
			excludeSyntax: ['\{\{.+?\}\}'] 			
		}
	}]
}
```


### 配置参数
- **baseUrl**
	
	必填。希望替换成的目标URL前缀

- **placeholder**

	非必填。publicPath的替换占位符。构建时如果匹配到placeholder设定的规则，则会执行baseUrl替换placeholder的逻辑，然后直接返回替换后的内容。如果没有匹配，则执行默认的baseUrl和源码相对url拼接的逻辑。

- **excludeSyntax**

	非必填。排除规则。替换时，需要考虑到已有的模板变量的写法，避免把其他变量也给替换了。


### loader的用法
[Documentation: Using loaders](https://webpack.github.io/docs/using-loaders.html).

### License
MIT

