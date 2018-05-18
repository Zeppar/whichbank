var express = require('express');
var mysql = require('mysql');
var userSQL = require('../db/Usersql');
var fs = require('fs');
var UUid = require("node-uuid");
var crypto = require("crypto");
var multiparty = require("multiparty");
//var FormData = require("form-data");
var router = express.Router();
var request = require("request");

var API_KEY = '2c4b3a21eb164eac9fc3fa9eca4f7b8a';
var API_SECRET = 'e3e22565f93045308c65104aaff93688';

var ADMIN_API_KEY = '87ca6fc077164b3e9c0bf16695111e70';
var ADMIN_API_SECRET = '6c839cbde6f446b19695e4af46c6a651';

var connection = mysql.createConnection({
	host: '101.200.166.241',
	user: 'root',
	password: '123',
	database: 'wechat_user',
	port: 3306
});

router.get('/faceDetect', function(req, res, next) {
	if(req.session.user != null && req.session.user != undefined) {
		res.render("faceDetect");
	} else {
		res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx99de7fe83e043204&redirect_uri=http://wechat.whichbank.com.cn/identity/findDir&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect');
	}
});

router.get("/adminFaceDetect", function(req, res, next) {
	if(req.session.manager != undefined && req.session.manager != null)
		res.render('mgrFaceDetect');
	else
		res.render('mgrLogin');
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
												'idnumber': results[0].idnumber,
												'userid': results[0].userid,
												'acstatus': results[0].acstatus,
												'actime': results[0].actime
											};
											req.session.user = user;
											res.render("faceDetect");
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
		res.render('register');
	}
});

router.post('/faceDetect', function(req, res) {
	var timestamp = new Date().getTime();
	var uuid = UUid.v1();
	var nonce = uuid.toString().replace(/-/g, '');
	var arr = new Array();
	arr[0] = timestamp;
	arr[1] = nonce;
	arr[2] = API_KEY;
	arr.sort();
	var join_str = "";
	for(var i = 0; i < arr.length; i++) {
		join_str += arr[i];
	}
	var hmac = crypto.createHmac('sha256', API_SECRET);
	hmac.update(join_str);
	var signature = hmac.digest('hex');
	var auth = "key=" + API_KEY + ",timestamp=" + timestamp + ",nonce=" + nonce + ",signature=" + signature;
	console.log(auth);

	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		console.log(files);
		var path = files["myfile"][0]["path"];

		fs.exists(path, function(exists) {
			if(!exists) {
				consloe.log(path + ' not exists.');
				res.json({
					"status": -1,
					"message": "验证失败"
				});
			} else {
				//do something
				var data = {
					name: req.session.user.username,
					idnumber: req.session.user.idnumber,
					video_file: fs.createReadStream(path)
				}
				request.post({
					url: 'https://v2-auth-api.visioncloudapi.com/identity/silent_idnumber_verification/stateless',
					formData: data,
					headers: {
						"Authorization": auth
					}
				}, function(err, httpResponse, body) {
					if(err) {
						return console.error('failed:', err);
					}
					console.log('successful!  Server responded with:', body);
					var obj = JSON.parse(body);
					var image_id = obj.image_id;
					if(obj.message != undefined) {
						res.json({
							"status": -1,
							"message": "验证失败"
						});
					} else {
						if(obj.passed) {
							var data = {
								api_id: ADMIN_API_KEY,
								api_secret: ADMIN_API_SECRET
							}
							request.post({
								url: 'https://v1-auth-api.visioncloudapi.com/search/db/list',
								formData: data
							}, function(err, httpResponse, body) {
								if(err) {
									res.json({
										"status": -1,
										"message": "验证失败"
									});
									return console.error('list failed:', err);
								}
								console.log("body : " + body);
								var obj = JSON.parse(body);
								if(obj.status != "OK") {
									res.json({
										"status": -1,
										"message": "验证失败"
									});
								} else {
									// upload to sense time database
									if(obj.list.length == 0) {
										// create database 
										var dataBaseName = "MyDataBase";
										var data = {
											api_id: ADMIN_API_KEY,
											api_secret: ADMIN_API_SECRET,
											name: dataBaseName
										}
										request.post({
											url: 'https://v1-auth-api.visioncloudapi.com/search/db/create',
											formData: data
										}, function(err, httpResponse, body) {
											if(err) {
												res.json({
													"status": -1,
													"message": "验证失败"
												});
												return console.error('list failed:', err);
											}
											var obj = JSON.parse(body);
											if(obj.status == "OK") {
												var data = {
													api_id: ADMIN_API_KEY,
													api_secret: ADMIN_API_SECRET,
													name: dataBaseName,
													selfie_image_id: image_id
												}
												request.post({
													url: 'https://v1-auth-api.visioncloudapi.com/search/image/insert',
													formData: data
												}, function(err, httpResponse, body) {
													if(err) {
														res.json({
															"status": -1,
															"message": "验证失败"
														});
														return console.error('list failed:', err);
													}
													var obj = JSON.parse(body);
													if(obj.status == "OK") {
														var userid = req.session.user.userid;
														var faceid = image_id;
														connection.query(userSQL.setUserFaceID, [faceid, userid], function(error, results) {
															if(error) {
																throw error;
															} else {
																console.log(results);
																console.log((obj.verification_score * 100).toFixed(2));
																res.json({
																	"status": 1,
																	"message": "验证成功, 相似度" + (obj.verification_score * 100).toFixed(2)
																});

															}
														});
													} else {
														res.json({
															"status": -1,
															"message": "验证失败"
														});
													}
												});
											} else {
												res.json({
													"status": -1,
													"message": "验证失败"
												});
											}
										});
									}
								}
							});
						}
					}
				});
			}
		});
	});
});

router.post('/adminFaceDetect', function(req, res) {

	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		console.log(files);
		var path = files["myfile"][0]["path"];

		fs.exists(path, function(exists) {
			if(!exists) {
				consloe.log(path + ' not exists.');
			} else {
				// judge if the search database exists
				var data = {
					api_id: ADMIN_API_KEY,
					api_secret: ADMIN_API_SECRET
				}
				request.post({
					url: 'https://v1-auth-api.visioncloudapi.com/search/db/list',
					formData: data
				}, function(err, httpResponse, body) {
					if(err) {
						res.json({
							"status": -1,
							"message": "验证失败"
						});
						return console.error('list failed:', err);
					}
					console.log("list : " + body);
					var obj = JSON.parse(body);
					if(obj.status != "OK") {
						res.json({
							"status": -1,
							"message": "验证失败"
						});
					} else {
						if(obj.list.length == 0) {
							// create database 
							var dataBaseName = "MyDataBase";
							var data = {
								api_id: ADMIN_API_KEY,
								api_secret: ADMIN_API_SECRET,
								name: dataBaseName
							}
							request.post({
								url: 'https://v1-auth-api.visioncloudapi.com/search/db/create',
								formData: data
							}, function(err, httpResponse, body) {
								if(err) {
									res.json({
										"status": -1,
										"message": "验证失败"
									});
									return console.error('list failed:', err);
								}
								console.log("create : " + body);
								var obj = JSON.parse(body);
								if(obj.status == "OK") {
									console.log("suc");
									var data = {
										api_id: ADMIN_API_KEY,
										api_secret: ADMIN_API_SECRET,
										name: dataBaseName,
										selfie_file: fs.createReadStream(path)
									}
									request.post({
										url: 'https://v1-auth-api.visioncloudapi.com/search/image/search',
										formData: data
									}, function(err, httpResponse, body) {
										if(err) {
											res.json({
												"status": -1,
												"message": "验证失败"
											});
											return console.error('list failed:', err);
										}
										console.log()
										var obj = JSON.parse(body);
										console.log('search : ' + obj)
										if(obj.status == "OK") {
											console.log("suc");
											// parse all info
											var result = obj.result;
											var highScoreId = "";
											var maxScore = -1;
											for(var i = 0; i < result.length; i++) {
												if(result[i].score >= maxScore) {
													maxScore = result[i].score;
													highScoreId = result[i].image_id;
												}
											}
											if(maxScore >= 80) {
												// search this id in my database
												connection.query(userSQL.getAllFaceID, function(error, results) {
													if(error) {
														throw error;
													} else {
														if(results.length != 0) {
															//is register
															for(var i = 0; i < results.length; i++) {
																if(results[i].image_id == highScoreId) {
																	res.json({
																		"status": 1,
																		"message": "验证成功"
																	});
																	return;
																}
															}
															res.json({
																"status": -1,
																"message": "验证失败"
															});
														} else {
															res.json({
																"status": -1,
																"message": "验证失败"
															});
														}
													}
												});
											} else {
												res.json({
													"status": -1,
													"message": "验证失败"
												});
											}

										} else {
											res.json({
												"status": -1,
												"message": "验证失败"
											});
										}
									});
								} else {
									console.log("fail");
								}
							});
						} else {
							// access database
							console.log("get database : " + obj.list[0]);
							var data = {
								api_id: ADMIN_API_KEY,
								api_secret: ADMIN_API_SECRET,
								name: obj.list[0],
								selfie_file: fs.createReadStream(path)
							}
							request.post({
								url: 'https://v1-auth-api.visioncloudapi.com/search/image/search',
								formData: data
							}, function(err, httpResponse, body) {
								if(err) {
									res.json({
										"status": -1,
										"message": "验证失败"
									});
									return console.error('list failed:', err);
								}
								console.log(body);
								var obj = JSON.parse(body);
								if(obj.status == "OK") {
									console.log("suc");
									// parse all info
									var result = obj.result;
									var highScoreId = "";
									var maxScore = -1;
									for(var i = 0; i < result.length; i++) {
										if(result[i].score >= maxScore) {
											maxScore = result[i].score;
											highScoreId = result[i].image_id;
										}
									}
									if(maxScore >= 80) {
										// search this id in my database
										connection.query(userSQL.getAllFaceID, function(error, results) {
											if(error) {
												throw error;
											} else {
												if(results.length != 0) {
													//is register
													for(var i = 0; i < results.length; i++) {
														if(results[i].image_id == highScoreId) {
															res.json({
																"status": 1,
																"message": "验证成功"
															});
															return;
														}
													}
													res.json({
														"status": -1,
														"message": "验证失败"
													});
												} else {
													res.json({
														"status": -1,
														"message": "验证失败"
													});
												}
											}
										});
									} else {
										res.json({
											"status": -1,
											"message": "验证失败"
										});
									}

								} else {
									res.json({
										"status": -1,
										"message": "验证失败"
									});
								}
							});
						}
					}
				});
			}
		});
	});

});

module.exports = router;