var express = require('express');
var session = require('express-session');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');

var index = require('./routes/index');
var users = require('./routes/users');
var idcode = require('./routes/idcode');
var qrcode = require('./routes/qrcode');

TopClient = require('./topClient').TopClient;
//
//var client = new TopClient({
//                          'appkey':'24690012',
//                          'appsecret':'3cb12066cc52b6ccf13686194a77dcc1',
//                          'REST_URL':'http://gw.api.taobao.com/router/rest'});
//
//client.execute('alibaba.aliqin.fc.sms.num.send',
//            {
//                'fields':'nick,type,sex,location',
//                'nick':'sandbox_c_1',
//                'extend' : '' ,
//               'sms_type' : 'normal' ,
//               'sms_free_sign_name' : '身份验证' ,
//               'sms_param' : "{code:'123456',product:'微尺伴客'}" ,
//               'rec_num' : '18765321992' ,
//               'sms_template_code' : "SMS_13256683"
//            },
//            function (error,response) {
//                if(!error)
//                  console.log(response);
//                else
//                  console.log(error);
//            })

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.engine('html', ejs.__express);
app.set('view engine', 'html');

// use 要放在所有use的第一句
app.use(cookieParser('zeppar'));
app.use(session({
	resave: true, // don't save session if unmodified  
	saveUninitialized: false, // don't create session until something stored  
	secret: 'zeppar'
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/idcode', idcode);
app.use('/qrcode', qrcode);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
//	if(!req.session.user) {
//		if(req.url == "/login") {
//			next(); //如果请求的地址是登录则通过，进行下一个请求  
//		} else {
//			res.redirect('/login');
//		}
//	} else if(req.session.user) {
//		next();
//	};
	next();
	//	var err = new Error('Not Found');
	//	err.status = 404;
	//	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});
app.disable('etag');

// var mysql = require('mysql');
// var connection = mysql.createConnection({
// 			host: 'localhost',
// 			user: 'root',
// 			password: '123',
// 			database: 'ExpressDB',
// 			port: 3306
// 		});

// connection.connect();

// connection.query('SELECT * FROM User', function (error, results) {
//   if (error) 
//   	throw error;
//   else {
//    console.log(results);
// 	}
// });

module.exports = app;