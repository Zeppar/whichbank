var express = require('express');
var router = express.Router();
var dbConfig = require('../db/DBConfig');
var codeSQL = require('../db/Codesql')
var Alidayu = require('alidayujs');
var mysql = require('mysql')
//应用密匙 见：http://www.alidayu.com/help?spm=a3142.7802526.1.24.iEB4Yc&_t=1#create 
var config = {
	app_key: '24690012',
	secret: '3cb12066cc52b6ccf13686194a77dcc1'
};
var alidayu = new Alidayu(config);
//参数 见：http://open.taobao.com/doc2/apiDetail.htm?apiId=25450 

var connection = mysql.createConnection({
	host: '101.200.166.241',
	user: 'root',
	password: '123',
	database: 'wechat_user',
	port: 3306
});

function addNumber(_idx) {
	var str = '';
	for(var i = 0; i < _idx; i += 1) {
		str += Math.floor(Math.random() * 10);
	}
	return str;
}

router.post('/sendCode', function(req, res) {
	console.log("phone : " + req.body.phone);
	var code = addNumber(6);
	//随机生成验证码
	var options = {
		sms_free_sign_name: '身份验证',
		sms_param: {
			code: code,
			product: '微尺伴客',
		},
		rec_num: req.body.phone,
		sms_template_code: 'SMS_13256683',
	};
	alidayu.sms(options, function(result) {
		var obj = JSON.parse(result);
		console.log(result);
		if(obj.error_response != undefined) {
			console.log("fail");
			//发送验证码失败
			res.json({
				"status": -1,
				"message": "获取验证码失败",
			});
		} else {
			console.log("success");

			//judge if contains
			connection.query(codeSQL.getCodeByPhone, [req.body.phone], function(error, results) {
				if(error)
					throw error;
				else {
					console.log(results);
					if(results.length != 0) {
						//exist  -- change
						console.log('change');
						connection.query(codeSQL.changeCodeByPhone, [code, req.body.phone], function(error, results) {
							if(error)
								throw error;
							else {
								console.log(results);
								//发送验证码成功
								res.json({
									"status": 1,
									"message": "获取验证码成功",
									"count":1
								});
							}
						});
					} else {
						//insert into database
						console.log('insert');
						connection.query(codeSQL.insert, [req.body.phone, code], function(error, results) {
							if(error)
								throw error;
							else {
								console.log(results);
								//发送验证码成功
								res.json({
									"status": 1,
									"message": "获取验证码成功"
								});
							}
						});
					}
				}
			});

		}
	});
});

module.exports = router;