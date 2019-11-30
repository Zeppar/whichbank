var express = require('express');
var session = require('express-session');

var URL = require('url');
var mysql = require('mysql');
var Alidayu = require('alidayujs');
var userSQL = require('../db/Usersql');
var codeSQL = require('../db/Codesql');
var dbConfig = require('../db/DBConfig');
var activeSQL = require('../db/Activesql');
var router = express.Router();
var request = require('request');
var formidable = require('formidable');
var node_xlsx = require('node-xlsx');
var fs = require('fs');

var connection = mysql.createConnection(dbConfig.mysql);

var alidayu = new Alidayu(config);
var config = {
	app_key: '24690012',
	secret: '3cb12066cc52b6ccf13686194a77dcc1'
};

// get request  -- unused
//router.get('/logingrant', function(req, res, next) {
//	//	res.send('respond with a resource');
//	res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx99de7fe83e043204&redirect_uri=http://wechat.whichbank.com.cn/users/login&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect');
//});

router.get('/registergrant', function(req, res, next) {
	//	res.send('respond with a resource');
	res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx99de7fe83e043204&redirect_uri=http://wechat.whichbank.com.cn/users/register&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect');
});

//注册界面
router.get('/register', function(req, res, next) {
	var param = req.query || req.params;
	// get access token by code and store it
	var code = param.code;
	if(code != undefined) {
		var reqAccessUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx99de7fe83e043204&secret=a887a6660a57550ea169f64e55d0c81f&code=' + code + '&grant_type=authorization_code';
		request(reqAccessUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log("console body :" + body);
				//store access token
				var obj = JSON.parse(body);
				if(obj.errcode != undefined) {
					res.render('register');
				} else {
					req.session.wechatAssess = obj;
					var reqUserInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + obj.access_token + '&openid=' + obj.openid + '&lang=zh_CN';
					request(reqUserInfoUrl, function(_error, _response, _body) {
						if(!_error && _response.statusCode == 200) {

							var user = JSON.parse(_body);
							// get user info
							if(user.errcode != undefined) {
								res.redirect('register');
							} else {
								console.log("console body 2 : " + _body);
								req.session.wechatUserInfo = user;
								res.render('register');
							}
						}
					});
				}
			}
		});
	} else {
		res.render('register');
	}
});

//登录界面
router.get('/login', function(req, res, next) {
	var param = req.query || req.params;
	// get access token by code and store it
	var code = param.code;
	if(code != undefined) {
		var reqAccessUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx99de7fe83e043204&secret=a887a6660a57550ea169f64e55d0c81f&code=' + code + '&grant_type=authorization_code';
		request(reqAccessUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log(body);
				//store access token
				var obj = JSON.parse(body);
				if(obj.errcode != undefined) {
					res.render('login');
				} else {
					req.session.wechatAssess = obj;
					var reqUserInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + obj.access_token + '&openid=' + obj.openid + '&lang=zh_CN';
					request(reqUserInfoUrl, function(_error, _response, _body) {
						if(!_error && response.statusCode == 200) {
							var user = JSON.parse(_body);
							if(user.errcode != undefined) {
								res.redirect('login');
							} else {
								console.log(_body);
								// get user info
								req.session.wechatUserInfo = user;
								res.render('login');
							}
						}
					});
				}
			}
		});
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

//get remain actime
router.get('/getRemainTimeAndFaceID', function(req, res, next) {
	var userid = req.session.user.userid;
	if(userid != null) {
		connection.query(userSQL.getUserByUserId, [userid], function(error, results) {
			if(error) {
				throw error;
			} else {
				if(results.length != 0) {
					var timelimit = new Date(); //实例化一个Date对象  
					timelimit.setTime(results[0].actime);
					console.log(timelimit.getFullYear());
					// 获取的是timestamp
					var ts = timelimit.setFullYear(timelimit.getFullYear() + 1);
					var time = ts - new Date().getTime();
					console.log("time : " + time);
					console.log("face : " + results[0].faceid);
					res.json({
						"status": 1,
						"message": "获取时间成功",
						"remain": time,
						"faceid": results[0].faceid
					});
				} else {
					res.json({
						"status": 0,
						"message": "暂无该账号信息"
					});
				}
			}
		});
	}
});

router.get("/usercenter", function(req, res) {
	//		res.render("usercenter", {
	//														username: 'req.session.user.username',
	//														phone: 'req.session.user.phone',
	//														icon: 'req.session.wechatUserInfo.headimgurl'
	//													});
	res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx99de7fe83e043204&redirect_uri=http://wechat.whichbank.com.cn/users/findDir&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect');
});

router.get("/findDir", function(req, res) {
	var param = req.query || req.params;
	var code = param.code;
	if(code != null) {
		var reqAccessUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx99de7fe83e043204&secret=a887a6660a57550ea169f64e55d0c81f&code=' + code + '&grant_type=authorization_code';
		request(reqAccessUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log("console body :" + body);
				//store access token
				var obj = JSON.parse(body);
				if(obj.errcode != undefined) {
					res.redirect('registergrant');
				} else {
					req.session.wechatAssess = obj;
					var reqUserInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + obj.access_token + '&openid=' + obj.openid + '&lang=zh_CN';
					request(reqUserInfoUrl, function(_error, _response, _body) {
						if(!_error && _response.statusCode == 200) {
							console.log("console body 2 : " + _body);
							var user = JSON.parse(_body);
							if(user.errcode != undefined) {
								res.redirect('registergrant');
							} else {
								// get user info
								req.session.wechatUserInfo = user;
								// judge dir
								connection.query(userSQL.getUserByUserId, [req.session.wechatUserInfo.openid], function(error, results) {
									if(error) {
										throw error;
									} else {
										if(results.length != 0) {
											//is register
											var user = {
												'phone': results[0].phone,
												'username': results[0].name,
												//												'idnumber': results[0].idnumber,
												'userid': results[0].userid,
												'acstatus': results[0].acstatus,
												'actime': results[0].actime
											};
											req.session.user = user;

											if(req.session.user.acstatus != 0) {

												var timelimit = new Date(); //实例化一个Date对象  
												timelimit.setTime(results[0].actime);

												console.log(results[0].actime)

												var ts = timelimit.setFullYear(timelimit.getFullYear() + 1);

												console.log(ts);
												var time = ts - new Date().getTime();
												console.log(time);
												if(time > 0) {
													res.render("usercenter", {
														username: req.session.user.username,
														phone: req.session.user.phone,
														icon: req.session.wechatUserInfo.headimgurl
													});
												} else {
													var accode = createACCode(6);
													var timestamp = new Date().getTime();

													console.log("deactiveUserAndUpdateAccode");
													console.log(timestamp);
													connection.query(userSQL.deactiveUserAndUpdateAccode, [0, timestamp, accode, req.session.user.userid], function(error, results) {
														if(error) {
															throw error;
														} else {
															res.render("active");
														}
													});

												}
											} else {

												res.render("active");
											}
										} else {
											res.render("register");
										}
									}
								});
							}
						}
					});
				}
			}
		});
	} else {
		res.redirect('usercenter');
	}
});

/*router.get("/usercenter", function(req, res) {
	if(req.session.wechatAssess != null && req.session.wechatAssess != undefined) {
		// get current userinfo by token and openid
		var reqUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + req.session.wechatAssess.access_token + '&openid=' + req.session.wechatAssess.openid + '&lang=zh_CN';
		request(reqUrl, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				console.log(body);
				var obj = JSON.parse(body);
				// store user info to session and init usercenter page
			if(obj.errcode != undefined) {				
					var refreshURL = "https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=wx99de7fe83e043204&grant_type=refresh_token&refresh_token=" + req.session.wechatAssess.refresh_token;
					request(reqUrl, function(error2, response2, body2) {
						if(!error2 && response2.statusCode == 200) {
							var obj2 = JSON.parse(body2);
							if(obj2.errcode != undefined) {
								res.redirect('logingrant');
							} else {
								req.session.wechatAssess = 
								res.redirect("usercenter");
							}
						}
					});
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
*/

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
										//										'idnumber': _results[0].idnumber,
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
									//add
									var timestamp = new Date().getTime();
									var accode = createACCode(6);
									connection.query(userSQL.insert, [req.session.wechatAssess.openid, req.body.phone, req.body.name, req.body.gender, req.body.birthday, 0, timestamp, 0, accode, ""], function(err, results) {
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
												//												'idnumber': req.body.idnumber,
												'userid': req.session.wechatAssess.openid,
												'acstatus': 0,
												'actime': 0
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

// 用户激活  -- todo
router.post('/active', function(req, res) {
	if(!req.session.user) {
		res.json({
			"status": 0,
			"message": "请先进行注册或登录操作"
		});
	}
	connection.query(userSQL.getAccodeByPhone, [req.session.user.phone], function(error, results) {
		if(error) {
			throw error;
		} else {
			if(results.length != 0) {
				if(results[0].acstatus == 0) {
					// 0 inact 1 sale 2 wechat
					if(req.body.code == results[0].accode) {
						connection.query(userSQL.getRealInfoByPhone, [req.session.user.phone], function(err, results) {
							if(error) {
								throw error;
							} else {
								if(results.length == 0) {
									var timestamp = new Date().getTime();
									console.log("activeUserByUserid");
									console.log(timestamp);
									connection.query(userSQL.activeUserByUserid, [1, timestamp, req.session.user.userid], function(error, results) {
										if(error) {
											throw error;
										} else {
											//save to other server
											//											var reqUrl = 'http://139.196.124.72:28889/CARD_ADD.aspx?id=' + req.session.user.idnumber + '&mc=' + req.session.user.phone + '&sj=' + req.session.user.phone + '&WXID=' + req.session.wechatAssess.openid; 
											if(req.session.user.actime != 0) {
												res.json({
													"status": 1,
													"message": "激活成功",
													"url": "/users/usercenter"
												});
											} else {

												var reqUrl = 'http://122.112.240.88:28889/CARD_ADD.aspx?id=' + req.session.user.phone +
													'&mc=' + escape(req.session.user.username) + '&sj=' + req.session.user.phone +
													'&WXID=' + req.session.wechatAssess.openid;
												//											var reqUrl = 'http://122.112.240.88:28889/CARD_ADD.aspx?id=15000000011'  
												//											+ '&mc=' + req.session.user.username + '&sj=15000000011'   
												//											+ '&WXID=' + req.session.wechatAssess.openid;
												console.log("reqUrl : " + reqUrl);
												request(reqUrl, function(error, response, body) {
													console.log("response.statusCode : " + response.statusCode);
													if(!error && response.statusCode == 200) {
														console.log(body);
														if(body.startsWith('Y')) {
															console.log("成功");
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
											}
											//											res.json({
											//												"status": 1,
											//												"message": "激活成功",
											//												"url": "/users/usercenter"
											//											});
										}
									});
								} else {
									connection.query(userSQL.getBatchTime, [results[0].batch], function(err, results) {
										if(error) {
											throw error;
										} else {
											//var timestamp = results[0].actime;

											var timelimit = new Date(); //实例化一个Date对象  
											timelimit.setTime(results[0].actime);
											var ts = timelimit.setFullYear(timelimit.getFullYear() + 1);
											var time = ts - new Date().getTime();
											
											var timestmap = results[0].actime;
											if(time < 0) {
												timestamp = new Date().getTime();
											}

											connection.query(userSQL.activeUserByUserid, [1, timestamp, req.session.user.userid], function(error, results) {
												if(error) {
													throw error;
												} else {
													//save to other server
													//													var reqUrl = 'http://139.196.124.72:28889/CARD_ADD.aspx?id=' + req.session.user.idnumber + '&mc=' + req.session.user.phone + '&sj=' + req.session.user.phone + '&WXID=' + req.session.wechatAssess.openid;
													if(req.session.user.actime != 0) {
														res.json({
															"status": 1,
															"message": "激活成功",
															"url": "/users/usercenter"
														});
													} else {
														var reqUrl = 'http://122.112.240.88:28889/CARD_ADD.aspx?id=' + req.session.user.phone +
															'&mc=' + escape(req.session.user.username) + '&sj=' + req.session.user.phone +
															'&WXID=' + req.session.wechatAssess.openid;
														console.log("reqUrl : " + reqUrl);
														request(reqUrl, function(error, response, body) {
															console.log("response.statusCode : " + response.statusCode);
															if(!error && response.statusCode == 200) {
																console.log(body);
																if(body.startsWith('Y')) {
																	console.log("成功");
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
													}
													//													res.json({
													//														"status": 1,
													//														"message": "激活成功",
													//														"url": "/users/usercenter"
													//													});
												}
											});
										}
									});
								}
							}
						});

					} else {
						res.json({
							"status": 0,
							"message": "激活码错误"
						});
					}
				} else {
					res.json({
						"status": 0,
						"message": "该用户已激活"
					});
				}
			} else {
				res.json({
					"status": 0,
					"message": "未找到当前用户"
				});
			}
		}
	});
	// judge code exist
	/*connection.query(activeSQL.getCode, [req.body.code], function(error, results) {
		if(error) {
			throw error;
		} else {
			if(results.length != 0) {
				// find code
				if(results[0].status == 0) {
					// 0 inact 1 sale 2 wechat
					var timestamp = new Date().getTime();
					connection.query(userSQL.activeUserByUserid, [1, timestamp, req.session.user.userid], function(error, results) {
						if(error) {
							throw error;
						} else {
							//save to other server
							var reqUrl = 'http://139.196.124.72:28889/CARD_ADD.aspx?id=' + req.session.user.idnumber + '&mc=' + req.session.user.phone + '&sj=' + req.session.user.phone + '&WXID=' + req.session.wechatAssess.openid;
							console.log("reqUrl : " + reqUrl);
							request(reqUrl, function(error, response, body) {
								console.log("response.statusCode : " + response.statusCode);
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
	});*/
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

//import --used by manager
router.get('/import', function(req, res, next) {
	res.render('import');
});

/*router.get('/testAdd', function(req, res, next) {
//	var reqUrl = 'http://122.112.240.88:28889/CARD_ADD.aspx?id=15000000006' 
//		+ '&mc=ds' + '&sj=15000000006' 
//		+ '&WXID=15000000006';
    var n = escape("你随机");
	var reqUrl = 'http://122.112.240.88:28889/CARD_ADD.aspx?id=19877763222&mc=' + '挖到' + '&sj=17852835452&WXID=oXhLlv8xoAf-Fm0Cq0iTIQqC-z88';
	console.log("reqUrl : " + reqUrl);
	request(reqUrl, function(error, response, body) {
		console.log("12323123213123213213213123   " + body);
		console.log("response.statusCode : " + response.statusCode);
		if(!error && response.statusCode == 200) {
			console.log(body);
			if(body.startsWith('Y')) {
				console.log("成功");
				req.session.user.acstatus = 1;
				res.json({
					"status": 1,
					"message": "激活成功"
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
});*/

router.post('/import', function(req, res) {
	var form = formidable.IncomingForm({
		encoding: 'utf-8', //上传编码
		uploadDir: "public/excels", //上传目录，指的是服务器的路径，如果不存在将会报错。
		keepExtensions: true, //保留后缀
		maxFieldsSize: 2 * 1024 * 1024 //byte//最大可上传大小
	});
	var allFile = [];
	var allFile = [];

	form.on('progress', function(bytesReceived, bytesExpected) { //在控制台打印文件上传进度
			var progressInfo = {
				value: bytesReceived,
				total: bytesExpected
			};
			console.log('[progress]: ' + JSON.stringify(progressInfo));
			//			res.write(JSON.stringify(progressInfo));
		})
		.on('file', function(filed, file) {
			allFile.push([filed, file]); //收集传过来的所有文件
		})
		.on('end', function() {})
		.on('error', function(err) {
			console.error('上传失败：', err.message);
			next(err);
			res.json({
				"status": 0,
				"message": "上传失败"
			});
		})
		.parse(req, function(err, fields, files) {
			if(err) {
				console.log(err);
			}
			allFile.forEach(function(file, index) {
				var fieldName = file[0];
				var types = file[1].name.split('.');
				var date = new Date();
				var ms = Date.parse(date);
				var savePath = form.uploadDir + "/" + types[0] + "." + String(types[types.length - 1]);
				fs.renameSync(file[1].path, savePath); //重命名文件，默认的文件名是带有一串编码的，我们要把它还原为它原先的名字。
				ExcelParse(savePath, currentBatch);
			});
			res.json({
				"status": 1,
				"message": "上传成功"
			});
		});
});

router.post('/importUser', function(req, res) {
	var form = formidable.IncomingForm({
		encoding: 'utf-8', //上传编码
		uploadDir: "public/excels", //上传目录，指的是服务器的路径，如果不存在将会报错。
		keepExtensions: true, //保留后缀
		maxFieldsSize: 2 * 1024 * 1024 //byte//最大可上传大小
	});
	var allFile = [];
	var allFile = [];

	form.on('progress', function(bytesReceived, bytesExpected) { //在控制台打印文件上传进度
			var progressInfo = {
				value: bytesReceived,
				total: bytesExpected
			};
			console.log('[progress]: ' + JSON.stringify(progressInfo));
			//			res.write(JSON.stringify(progressInfo));
		})
		.on('file', function(filed, file) {
			allFile.push([filed, file]); //收集传过来的所有文件
		})
		.on('end', function() {})
		.on('error', function(err) {
			console.error('上传失败：', err.message);
			next(err);
			res.json({
				"status": 0,
				"message": "上传失败"
			});
		})
		.parse(req, function(err, fields, files) {
			if(err) {
				console.log(err);
			}
			allFile.forEach(function(file, index) {
				var fieldName = file[0];
				var types = file[1].name.split('.');
				var date = new Date();
				var ms = Date.parse(date);
				var savePath = form.uploadDir + "/" + types[0] + "." + String(types[types.length - 1]);
				fs.renameSync(file[1].path, savePath); //重命名文件，默认的文件名是带有一串编码的，我们要把它还原为它原先的名字。
				ExcelUserParse(savePath, currentBatch);
			});
			res.json({
				"status": 1,
				"message": "上传成功"
			});
		});
});

var currentBatch = 0;
router.get("/judgeBatch", function(req, res, next) {
	var param = req.query || req.params;
	// get access token by code and store it
	var batch = param.batch;
	if(batch != undefined) {
		connection.query(userSQL.getRealInfoByBatch, [batch], function(error, results) {
			if(error) {
				throw error;
			} else {
				console.log(results);
				if(results.length != 0) {
					res.json({
						"status": 0,
						"message": "批次重复"
					});
				} else {
					currentBatch = batch;
					res.json({
						"status": 1,
						"message": "添加批次成功"
					});
				}
			}
		});
	} else {
		res.json({
			"status": 0,
			"message": "参数错误"
		});
	}
});

function RandomNum(Min, Max) {      
	var Range = Max - Min;      
	var Rand = Math.random();      
	var num = Min + Math.round(Rand * Range);      
	return num;
}

function createACCode(_idx) {
	var str = '';
	for(var i = 0; i < _idx; i += 1) {
		var t = Math.floor(Math.random() * 10);
		//		if(t >= 0 && t < 3) {
		//			str += String.fromCharCode(RandomNum(65, 90));
		//		} else if(t >= 3 && t < 6) {
		//			str += String.fromCharCode(RandomNum(97, 122));
		//		} else if(t >= 6 && t <= 9) {
		str += String.fromCharCode(RandomNum(48, 57));
		//		}
	}
	return str;
}

function contains(arr, obj) {
	for(var i = 0; i < arr.length; i++) {
		if(arr[i] == obj) {
			return true;
		}
	}
	return false;
}

var ExcelParse = function(newPath, batch) {
	console.log("ExcelParse");
	var obj = node_xlsx.parse(newPath);
	var excelObj = obj[0].data; //取得第一个excel表的数据  

	// 循环遍历表每一行的数据  
	var sqlOperation = "INSERT INTO UserRealInfo (name, idnumber, phone, cardid, batch) VALUES ";
	// var sqlOperation = "INSERT INTO User (phone, name, gender, acstatus, actime) VALUES ";
	var list = new Array();
	var findNew = false;
	connection.query(userSQL.getRealInfo, function(error, results) {
		if(error) {
			throw error;
		} else {
			if(results.length != 0) {
				// all user
				for(var i = 0; i < results.length; i++) {
					list[i] = results[i].idnumber;
				}
				console.log("Add");
				console.log("length : " + list.length);
			}
			// judge if exist
			for(var i = 2; i < excelObj.length; i++) {
				var rdata = excelObj[i];
				// 判断存在性 并存储进数据库
				if(!contains(list, rdata[2].toString().trim())) {
					findNew = true;
					var str = "(";
					for(var j = 1; j < rdata.length; j++) {
						str += ('"' + rdata[j].toString().trim() + '",');
					}
					str += (batch + ")");
					str += ","
					sqlOperation += str;
				}
			}
			if(findNew) {
				sqlOperation = sqlOperation.substring(0, sqlOperation.length - 1);
				connection.query(sqlOperation, function(error, results) {
					if(error) {
						throw error;
					} else {
						console.log("导入新用户成功");
					}
				});
			}
		}
	});
};

var ExcelUserParse = function(newPath, batch, phone) {
	console.log("ExcelParse");
	var obj = node_xlsx.parse(newPath);
	var excelObj = obj[0].data; //取得第一个excel表的数据  

	// 循环遍历表每一行的数据  
	var sqlOperation = "INSERT INTO User (phone, name, gender, acstatus, actime) VALUES ";
	var list = new Array();
	var findNew = false;
	for(var i = 1; i < excelObj.length - 1; i++) {
		var rdata = excelObj[i];
		// 判断存在性 并存储进数据库
		if(!contains(list, rdata[1].toString().trim())) {
			findNew = true;
			var str = "(";
			str += ('"' + rdata[1].toString().trim() + '",');
			str += ('"微尺伴客会员",');
			var sex = rdata[10].toString().trim();
			if(sex == "男士")
				str += ('1,');
			else 
				str += ('2,');
			str += ('1,');
			var time = rdata[18].toString().trim();
			var t = time.split(' ')[0];
			var arr = t.split('-');
			var actime = new Date();
			actime.setFullYear(arr[0]);
			actime.setMonth(arr[1]);
			actime.setDate(arr[2]);
			str += (actime + ',');
			sqlOperation += str;
		}
	}
	if(findNew) {
		sqlOperation = sqlOperation.substring(0, sqlOperation.length - 1);
		connection.query(sqlOperation, function(error, results) {
			if(error) {
				throw error;
			} else {
				console.log("导入新用户成功");
			}
		});
	}
};

// get code
router.get('/getAccode', function(req, res, next) {
	var param = req.query || req.params;
	var phone = param.phone;
	connection.query(userSQL.getAccodeByPhone, [phone], function(error, results) {
		if(error) {
			throw error;
		} else {
			if(results.length == 0) {
				res.json({
					"status": 0,
					"message": "未找到该用户"
				});
			} else {
				res.json({
					"status": 1,
					"message": "查找激活码成功",
					"code": results[0].accode
				})
			}
		}
	});
});

module.exports = router;
