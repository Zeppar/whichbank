var express = require('express');
var session = require('express-session');

var URL = require('url');
var User = require('./user');
var mysql = require('mysql');
var dbConfig = require('../db/DBConfig');
var userSQL = require('../db/Usersql');
var Alidayu = require('alidayujs');
var codeSQL = require('../db/Codesql');
var router = express.Router();
var request = require('request');

// 使用DBConfig.js的配置信息创建一个MySQL连接池
// var pool = mysql.createPool( dbConfig.mysql );

var connection = mysql.createConnection({
	host: '101.200.166.241',
	user: 'root',
	password: '123',
	database: 'wechat_user',
	port: 3306
});

var alidayu = new Alidayu(config);
var config = {
	app_key: '24690012',
	secret: '3cb12066cc52b6ccf13686194a77dcc1'
};

// get request
router.get('/grant', function(req, res, next) {
	//	res.send('respond with a resource');
	res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx99de7fe83e043204&redirect_uri=http://wechat.whichbank.com.cn/users/register&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect');
});

var wechatAssess = null;
var wechatUserInfo = null;
//注册界面
router.get('/register', function(req, res, next) {
	var param = req.query || req.params;
	// get access token by code and store it
	var code = param.code;
	var saveFunc = function(a) {
		req.session.wechatUserInfo = a;
	}
	var reqAccessUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx99de7fe83e043204&secret=a887a6660a57550ea169f64e55d0c81f&code=' + code + '&grant_type=authorization_code';
	request(reqAccessUrl, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			console.log(body);
			//store access token
			var obj = JSON.parse(body);
			wechatAssess = obj;
			var reqUserInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + obj.access_token + '&openid=' + obj.openid + '&lang=zh_CN';
			request(reqUserInfoUrl, function(_error, _response, _body) {
				if(!_error && response.statusCode == 200) {
					console.log(_body);
					var user = JSON.parse(_body);
					// get user info
					wechatUserInfo = user;
				}
			});
		}
	});
	console.log('get code : ' + param.code);
	res.render('register');
});

//登录界面
router.get('/login', function(req, res, next) {
	res.render('login');
});

//登出
//router.get('/logout', function(req, res, next) {
//	req.session.user = null;
//	res.render('login');
//});

router.get("/usercenter", function(req, res) {
	// test
	//	res.render("usercenter", {
	//						username: 'req.session.user.username',
	//						phone: 'eq.session.user.phone',
	//						icon: 'https://ss0.baidu.com/6ONWsjip0QIZ8tyhnq/it/u=808646667,3983686754&fm=58&u_exp_0=241613052,3650381344&fm_exp_0=86&bpow=1024&bpoh=1024'
	//					});
	if(req.session.wechatAssess != null) {
		// get current userinfo by token and openid
		var reqUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + req.session.wechatAssess.access_token + '&openid=' + req.session.wechatAssess.openid + '&lang=zh_CN';
		request(reqUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log(body);
				// if token is not out of date
				// store user info to session and init usercenter page
				if(req.session.user != null) {
					res.render("usercenter", {
						username: req.session.user.username,
						phone: req.session.user.phone,
						icon: req.session.wechatUserInfo.headimgurl
					});
				} else {
					res.render('login');
				}
			}
		});
	} else {
		//grant
		res.redirect('grant');
	}
});
// post request
// 判断是否注册
router.post("/judgeRegister", function(req, res) {
	console.log(req.body.phone);
	connection.query(userSQL.getUserByPhone, [req.body.phone], function(error, results) {
		if(error) {
			throw error;
		} else {
			if(results.length != 0) {
				//is register
				res.json({
					"status": 1
				});
			} else {
				res.json({
					"status": -1,
					"message": "请先注册账号"
				});
			}
		}
	});
})
//登录
router.post('/login', function(req, res) {
	console.log(req.body.phone);
	console.log(req.body.code);

	req.session.wechatAssess = wechatAssess;
	req.session.wechatUserInfo = wechatUserInfo;

	//check if code is right
	connection.query(codeSQL.getCodeByPhone, [req.body.phone], function(error, results) {
		if(error) {
			throw error;
		} else {
			console.log(results);
			if(results.length != 0) {
				//find it
				var code = results[0].code;
				var time = results[0].timestamp;
				console.log('time : ' + time);
				//judge if it is out of date
				var currentTime = new Date().getTime();
				console.log('current : ' + currentTime);
				if(currentTime - time > 60 * 1000 * 5) {
					//delete code
					connection.query(codeSQL.deleteCodeByPhone, [req.body.phone], function(_error2, _result2) {
						if(error)
							throw error;
						else
							console.log("success delete code!!!");
					});

					res.json({
						"status": -1,
						"message": "验证码已过期"
					});

				} else {
					if(code == req.body.code) {
						//login
						//get data from database
						connection.query(userSQL.getUserByUserId, [wechatAssess.openid], function(_error, _results) {
							if(_error)
								throw _error
							else {
								if(_results.length != 0) {
									// session
									console.log(_results);
									var user = {
										'phone': req.body.phone,
										'username': _results[0].name,
										'idnumber': _results[0].idnumber,
										'userid': _results[0].userid
									};
									req.session.user = user;

									//delete code 
									connection.query(codeSQL.deleteCodeByPhone, [req.body.phone], function(_error2, _result2) {
										if(error)
											throw error;
										else
											console.log("success delete code!!!");
									});
									res.json({
										"status": 1,
										"message": "登陆成功",
										"url": "/users/usercenter"
									});
								} else {
									res.json({
										"status": -1,
										"message": "获取用户信息失败"
									});;
								}
							}
						});
					} else {
						res.json({
							"status": -1,
							"message": "验证码错误"
						});;
					}
				}
			} else {
				res.json({
					"status": -1,
					"message": "验证码错误"
				});;
			}
		}
	});
});

//添加用户  post请求
router.post('/register', function(req, res) {
	//check if code is right
	//	console.log('12312312312123 show data');
	//	console.log(wechatAssess);
	//	console.log(wechatUserInfo);
	req.session.wechatAssess = wechatAssess;
	req.session.wechatUserInfo = wechatUserInfo;
	connection.query(codeSQL.getCodeByPhone, [req.body.phone], function(error, results) {
		if(error) {
			throw error;
		} else {
			console.log(results);
			if(results.length != 0) {
				//find it
				var code = results[0].code;
				var time = results[0].timestamp;
				//judge if it is out of date
				var currentTime = new Date().getTime();
				if(currentTime - time > 60 * 1000 * 5) {
					//delete code
					connection.query(codeSQL.deleteCodeByPhone, [req.body.phone], function(_error2, _result2) {
						if(error)
							throw error;
						else
							console.log("success delete code!!!");
					});

					res.json({
						"status": -1,
						"message": "验证码已过期"
					});

				} else {
					if(code == req.body.code) {
						//	find in database
						connection.query(userSQL.getUserByUserId, [wechatAssess.openid], function(error, results) {
							if(error) {
								throw error;
							} else {
								console.log(results.length);
								if(results.length != 0) {
									console.log("this account is register");
									res.json({
										"status": -1,
										"message": "当前微信号已注册"
									});
								} else {
									// console.log("start register");
									// 直接返回数据
									// res.json({"status":1});
									//add
									console.log('start reg');
									connection.query(userSQL.insert, [wechatAssess.openid, req.body.phone, req.body.name, req.body.idnumber, req.body.gender, req.body.birthday], function(err, results) {
										if(error) {
											throw error;
										} else {
											console.log(results);
											// delete code 
											connection.query(codeSQL.deleteCodeByPhone, [req.body.phone], function(_error2, _result2) {
												if(error)
													throw error;
												else
													console.log("success delete code!!!");
											});
											var user = {
												'phone': req.body.phone,
												'username': req.body.name,
												'idnumber': req.body.idnumber,
												'userid': req.body.userid
											};
											req.session.user = user;
											res.json({
												"status": 1,
												"message": "注册成功",
												"url": "/users/usercenter"
											});
										}
									});
								}
							}
						});
					} else {
						res.json({
							"status": -1,
							"message": "验证码错误"
						});;
					}
				}
			} else {
				res.json({
					"status": -1,
					"message": "验证码错误"
				});;
			}
		}
	});
});

module.exports = router;