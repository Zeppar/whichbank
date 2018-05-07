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
	//	if(req.session.user != null && req.session.user != undefined) {
	res.render("faceDetect");
	//	}
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