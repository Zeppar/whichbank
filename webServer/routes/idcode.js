var express = require('express');
var router = express.Router();
var codeSQL = require('../db/Codesql');
var dbConfig = require('../db/DBConfig');
var Alidayu = require('alidayujs');
var mysql = require('mysql');

var config = {
	app_key: '24690012',
	secret: '3cb12066cc52b6ccf13686194a77dcc1'
};
var alidayu = new Alidayu(config);

var connection = mysql.createConnection(dbConfig.mysql);

function addNumber(_idx) {
	var str = '';
	for(var i = 0; i < _idx; i += 1) {
		str += Math.floor(Math.random() * 10);
	}
	return str;
}

TopClient = require('../topClient').TopClient;

var client = new TopClient({
	'appkey': '24690012',
	'appsecret': '3cb12066cc52b6ccf13686194a77dcc1',
	'REST_URL': 'http://gw.api.taobao.com/router/rest'
});

router.post('/sendCode', function(req, res) {
	console.log("phone : " + req.body.phone);
	var code = addNumber(6);
	client.execute('alibaba.aliqin.fc.sms.num.send', {
			//			'fields': 'nick,type,sex,location',
			//			'nick': 'sandbox_c_1',
			'extend': '',
			'sms_type': 'normal',
			'sms_free_sign_name': '微尺伴客',
			'sms_param': "{code:'" + code + "',product:'微尺伴客'}",
			'rec_num': req.body.phone,
			'sms_template_code': "SMS_13256687"
		},
		function(error, response) {
			if(!error) {
				console.log(response);
				connection.query(codeSQL.getCodeByPhone, [req.body.phone], function(error, results) {
					if(error)
						throw error;
					else {
						console.log(results);
						var timestamp = new Date().getTime()
						console.log(timestamp);
						if(results.length != 0) {
							//exist  -- change
							console.log('change');
							connection.query(codeSQL.changeCodeByPhone, [code, timestamp, req.body.phone], function(error, results) {
								if(error)
									throw error;
								else {
									console.log(results);
									//发送验证码成功
									res.json({
										"status": 1,
										"message": "获取验证码成功",
										"count": 1
									});
								}
							});
						} else {
							//insert into database
							console.log('insert');
							connection.query(codeSQL.insert, [req.body.phone, code, timestamp], function(error, results) {
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
			} else {
				console.log(error);
				res.json({
					"status": -1,
					"message": "获取验证码失败",
				});
			}
		})
});

module.exports = router;
