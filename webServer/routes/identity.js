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
			} else {
				//do something
				var data = {
					name: req.session.user.username,
					idnumber: req.session.user.idnumber,
					video_file: fs.createReadStream(path)
				}
				console.log(req.session.user.username);
				console.log(req.session.user.idnumber);
				request.post({
					url: 'https://v2-auth-api.visioncloudapi.com/identity/silent_idnumber_verification/stateless',
					formData: data,
					headers: {
						"Authorization": auth
					}
				}, function(err, httpResponse, body) {
					if(err) {
						return console.error('upload failed:', err);
					}
					console.log('successful!  Server responded with:', body);
					var obj = JSON.parse(body);
					if(obj.message != undefined) {
						console.log("4");
						res.json({
							"status": -1,
							"message": "验证失败"
						});
					} else {
						if(obj.passed) {
							var userid = req.session.user.userid;
							var faceid = obj.image_id;
							console.log(userid);
							console.log(faceid);
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
					}
				});
			}
		});
	});
});

module.exports = router;