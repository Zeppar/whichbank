var express = require('express');
var session = require('express-session');

var URL = require('url');
var mysql = require('mysql');
var Alidayu = require('alidayujs');
var userSQL = require('../db/Usersql');
var codeSQL = require('../db/Codesql');
var activeSQL = require('../db/Activesql');
var router = express.Router();
var request = require('request');

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
router.get('/logingrant', function(req, res, next) {
	//	res.send('respond with a resource');
	res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx99de7fe83e043204&redirect_uri=http://wechat.whichbank.com.cn/users/login&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect');
});

router.get('/registergrant', function(req, res, next) {
	//	res.send('respond with a resource');
	res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx99de7fe83e043204&redirect_uri=http://wechat.whichbank.com.cn/users/register&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect');
});

//var wechatAssess = null;
//var wechatUserInfo = null;
//注册界面
router.get('/register', function(req, res, next) {
	if(req.session.wechatUserInfo == null || req.session.wechatUserInfo == undefined) {
		var param = req.query || req.params;
		// get access token by code and store it
		var code = param.code;
		var reqAccessUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx99de7fe83e043204&secret=a887a6660a57550ea169f64e55d0c81f&code=' + code + '&grant_type=authorization_code';
		request(reqAccessUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log("console body :" + body);
				//store access token
				var obj = JSON.parse(body);
				req.session.wechatAssess = obj;
				var reqUserInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + obj.access_token + '&openid=' + obj.openid + '&lang=zh_CN';
				request(reqUserInfoUrl, function(_error, _response, _body) {
					if(!_error && _response.statusCode == 200) {
						console.log("console body 2 : " + _body);
						var user = JSON.parse(_body);
						// get user info
						req.session.wechatUserInfo = user;
						res.render('register');
					}
				});
			}
		});
	} else {
		console.log(req.session.wechatAssess);
		res.render('register');
	}
});

//登录界面
router.get('/login', function(req, res, next) {
	var param = req.query || req.params;
	console.log(req.session.wechatAssess);
	// get access token by code and store it
	var code = param.code;
	if(code != undefined) {
		var reqAccessUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx99de7fe83e043204&secret=a887a6660a57550ea169f64e55d0c81f&code=' + code + '&grant_type=authorization_code';
		request(reqAccessUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log(body);
				//store access token
				var obj = JSON.parse(body);
				req.session.wechatAssess = obj;
				var reqUserInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + obj.access_token + '&openid=' + obj.openid + '&lang=zh_CN';
				request(reqUserInfoUrl, function(_error, _response, _body) {
					if(!_error && response.statusCode == 200) {
						console.log(_body);
						var user = JSON.parse(_body);
						// get user info
						req.session.wechatUserInfo = user;
						res.redirect('logingrant');
					}
				});
			}
		});
		res.render('login');
	} else {
		res.render('login');
	}
});

router.get('/active', function(req, res, next) {
	res.render('active');
});

router.get('/adminCenter', function(req, res, next) {
	if(req.session.manager != undefined && req.session.manager != null)
		res.render('mgrCenter');
	else
		res.render('mgrLogin');
});

router.get('/adminLogin', function(req, res, next) {
	res.render('mgrLogin');
});

//登出
//router.get('/logout', function(req, res, next) {
//	req.session.user = null;
//	res.render('login');
//});

router.get("/usercenter", function(req, res) {
	if(req.session.wechatAssess != null && req.session.wechatAssess != undefined) {
		// get current userinfo by token and openid
		var reqUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + req.session.wechatAssess.access_token + '&openid=' + req.session.wechatAssess.openid + '&lang=zh_CN';
		request(reqUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log(body);
				var obj = JSON.parse(body);
				// store user info to session and init usercenter page
				if(obj.errcode != undefined /*token is out of date*/ ) {
					res.redirect('logingrant');
				} else {
					// if token is not out of date
					if(req.session.user != null && req.session.user != undefined) {
						if(req.session.user.acstatus != 0) {
							res.render("usercenter", {
								username: req.session.user.username,
								phone: req.session.user.phone,
								icon: req.session.wechatUserInfo.headimgurl
							});
						} else {
							res.render("active");
						}
					} else {
						res.render('login');
					}
				}
			}
		});
	} else {
		//grant
		res.redirect('registergrant');
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
	//	console.log(req.body.phone);
	//	console.log(req.body.code);

	//	req.session.wechatAssess = wechatAssess;
	//	req.session.wechatUserInfo = wechatUserInfo;

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
						connection.query(userSQL.getUserByUserId, [req.session.wechatAssess.openid], function(_error, _results) {
							if(_error)
								throw _error
							else {
								if(_results.length != 0) {
									// session
									var user = {
										'phone': req.body.phone,
										'username': _results[0].name,
										'idnumber': _results[0].idnumber,
										'userid': _results[0].userid,
										'acstatus': _results[0].acstatus
									};
									req.session.user = user;

									//delete code 
									connection.query(codeSQL.deleteCodeByPhone, [req.body.phone], function(_error2, _result2) {
										if(error)
											throw error;
										else
											console.log("success delete code!!!!!!!");
									});
									console.log(_results[0].acstatus);
									if(user.acstatus != 0) {
										res.json({
											"status": 1,
											"message": "登陆成功",
											"url": "/users/usercenter"
										});
									} else {
										res.json({
											"status": 1,
											"message": "登陆成功",
											"url": "/users/active"
										});
									}
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
	//	req.session.wechatAssess = wechatAssess;
	//	req.session.wechatUserInfo = wechatUserInfo;
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
//				if(currentTime - time > 60 * 1000 * 5) {
				if(0) {
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
						//						console.log("wechatAssess.openid : " + wechatAssess.openid);
						connection.query(userSQL.getUserByUserId, [req.session.wechatAssess.openid], function(error, results) {
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
									console.log('start reg : ' + req.session.wechatAssess.openid);
									connection.query(userSQL.insert, [req.session.wechatAssess.openid, req.body.phone, req.body.name, req.body.idnumber, req.body.gender, req.body.birthday, 0], function(err, results) {
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
												'userid': req.session.wechatAssess.openid,
												'acstatus': 0

											};
											req.session.user = user;
											res.json({
												"status": 1,
												"message": "注册成功",
												"url": "/users/active"
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

// 用户激活
router.post('/active', function(req, res) {
	if(!req.session.user) {
		res.json({
			"status": 0,
			"message": "请先进行注册或登录操作"
		});
	}
	// judge code exist
	connection.query(activeSQL.getCode, [req.body.code], function(error, results) {
		if(error) {
			throw error;
		} else {
			if(results.length != 0) {
				// find code
				if(results[0].status == 0) {
					// 0 inact 1 sale 2 wechat
					connection.query(userSQL.activeUserByUserid, [1, req.session.user.userid], function(error, results) {
						if(error) {
							throw error;
						} else {
							//save to other server
							var reqUrl = 'http://139.196.124.72:28889/CARD_ADD.aspx?id=' + req.session.user.idnumber + '&mc=' + req.session.user.username + '&sj=' + req.session.user.phone + '&WXID=' + req.session.wechatAssess.openid;
							console.log("request Url : " + reqUrl);
							request({encoding: null, url: encodeURI(reqUrl)}, function(error, response, body) {
//								console.log("response.statusCode : " + response.statusCode);
								if(!error && response.statusCode == 200) {
									console.log(body);
									if(body.startsWith('Y')) {
										console.log("成功");
										// delete active code
										connection.query(activeSQL.changeCodeStatus, [req.body.code], function(error, results) {
											if(error) {
												throw error;
											} else {
												console.log("change active code status successfully!");
											}
										});
										req.session.user.acstatus = 1;
										res.json({
											"status": 1,
											"message": "激活成功",
											"url": "/users/usercenter"
										});
									} else {
										console.log("失败");
										res.json({
											"status": -1,
											"message": "激活失败"
										});
									}
								} else {
									console.log('error');
									res.json({
										"status": -1,
										"message": "激活失败"
									});
								}
							});
							//							res.json({
							//								"status": 1,
							//								"message": "激活成功",
							//								"url": "/users/usercenter"
							//							});
						}
					});
				} else {
					res.json({
						"status": 0,
						"message": "激活码已经被使用"
					});
				}
			} else {
				res.json({
					"status": 0,
					"message": "激活码错误"
				});
			}
		}
	});
});

router.post('/adminLogin', function(req, res) {
	console.log(req.body.username);
	connection.query(userSQL.getManagerByUsername, [req.body.username], function(error, results) {
		console.log("start");
		if(error) {
			throw error;
		} else {
			console.log(results);
			if(results.length != 0) {
				if(results[0].password == req.body.password) {
					req.session.manager = {
						'username': req.body.username
					};
					res.json({
						"status": 1,
						"message": "登录成功",
						"url": "/users/adminCenter"
					});
				} else {
					res.json({
						"status": 0,
						"message": "密码错误"
					});
				}
			} else {
				res.json({
					"status": 0,
					"message": "管理员不存在"
				});
			}
		}
	});
});

module.exports = router;