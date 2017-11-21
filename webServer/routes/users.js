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

var responseJSON = function(res, ret) {
	if(typeof ret == 'undefined') {
		res.json({
			code: '-200',
			msg: '操作失败'
		});
	} else {
		res.json(ret);
	}
}
//显示所有的用户
router.get('/showAllUser', function(req, res, next) {
	connection.query(userSQL.queryAll, function(error, results) {
		if(error)
			throw error;
		else {
			console.log(results);
			res.send(JSON.stringify(results));
		}
	});
});

//添加用户  get请求
//router.get('/addUser', function(req, res, next) {
//	var param = req.query || req.params;
//	console.log(param.phone);
//	console.log(param.code);
//	console.log(param.name);
//	console.log(param.gender);
//	console.log(param.birthday);
//	connection.query(userSQL.insert, [param.phone, param.name, param.gender, param.birthday], function(error, results) {
//		if(error)
//			throw error;
//		else {
//			console.log(results);
//			res.send(JSON.stringify(results));
//		}
//	});
//});

// var data = {
//		         mobile: $('.js-mobile-val').val(),
//		         code: $('.vercode').val(),
//		         name: $('#name').val(),
//		         gender: $('#gender').val(),
//		         birthday: $('#birthday').val()
//		     };

//if (data['count'] == 0) {
//                          //该手机号没有会员卡
//                          util.confirm('当前手机号未注册，是否选择注册?', '提醒', ['换手机号登录', '注册'], function (e) {
//                              if (e.index == 0) {
//                                  $('.js-mobile-val').val('');
//                              } else {
//                                  window.location.href = "/app/index.php?c=entry&do=auth/sign-up&i=4&m=fangsuo";
//                              }
//                          });
//                      }
//判断是否注册
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
				//judge if it is out of date
				var currentTime = new Date().getTime();
				if(currentTime - time > 60 * 1000) {
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
						connection.query(userSQL.getUserByPhone, [req.body.phone], function(_error, _results) {
							if(_error)
								throw _error
							else {
								if(_results.length != 0) {
									// session
									var user = {
										'phone': req.body.phone,
										'username': _results[0].name
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
router.get("/usercenter", function(req, res) {
	if(req.session.user != null)
		res.render("usercenter", {
			username: req.session.user.username,
			phone: req.session.user.phone,
		});
	else
		res.render("login");
});
//添加用户  post请求
router.post('/register', function(req, res) {
	console.log(req.body.phone);
	console.log(req.body.name);
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
				//judge if it is out of date
				var currentTime = new Date().getTime();
				if(currentTime - time > 60 * 1000) {
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
						connection.query(userSQL.getUserByPhone, [req.body.phone], function(error, results) {
							if(error) {
								throw error;
							} else {
								console.log(results.length);
								if(results.length != 0) {
									console.log("this account is register");
									res.json({
										"status": -1,
										"message": "手机号已注册"
									});
								} else {
									// console.log("start register");
									// 直接返回数据
									// res.json({"status":1});
									//add
									console.log('start reg');
									connection.query(userSQL.insert, [req.body.phone, req.body.name, req.body.gender, req.body.birthday], function(err, results) {
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
												'username': req.body.name
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

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.send('respond with a resource');
});

//注册界面
router.get('/register', function(req, res, next) {
	res.render('register');
});

//登录界面
router.get('/login', function(req, res, next) {
	res.render('login');
});

//登出
router.get('/logout', function(req, res, next) {
	req.session.user = null;
	res.render('login');
});

router.get('/getUserInfo', function(req, res, next) {
	var user = new User();
	var params = URL.parse(req.url, true).query;
	if(params.id == '1') {
		user.name = "ligh";
		user.age = "1";
		user.city = "北京市";
	} else {
		user.name = "SPTING";
		user.age = "1";
		user.city = "杭州市";
	}
	var response = {
		status: 1,
		data: user
	};
	res.send(JSON.stringify(response));
})

module.exports = router;