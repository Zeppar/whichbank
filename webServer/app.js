var express = require('express');
var session = require('express-session');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');

var index = require('./routes/index');
var users = require('./routes/users');
var identity = require('./routes/identity');
var idcode = require('./routes/idcode');
var qrcode = require('./routes/qrcode');
var accode = require('./routes/accode');
var request = require('request');

TopClient = require('./topClient').TopClient;

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
app.use('/identity', identity);
app.use('/idcode', idcode);
app.use('/qrcode', qrcode);
app.use('/accode', accode);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
//	res.redirect('/active');
//	if(!req.session.user) {
//		if(req.url == "/login") {
//			next(); //如果请求的地址是登录则通过，进行下一个请求  
//		} else {
//			res.redirect('/login');
//		}
//	} else if(req.session.user) {
//		if(req.session.user.acstatus != 0) {
//			next();
//		} else {
//			res.redirect('/active');
//		}
//	};
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
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

module.exports = app;