var express = require('express');
var router = express.Router();
var activeSQL = require('../db/Activesql');
var mysql = require('mysql');

var connection = mysql.createConnection({
	host: '101.200.166.241',
	user: 'root',
	password: '123',
	database: 'wechat_user',
	port: 3306
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

//router.post('/create', function(req, res) {
//	// add cardid if exist -> select else insert 
//	connection.query(activeSQL.getAllCode, [], function(error, results) {
//		if(error) {
//			throw error;
//		} else {
//			var accode = createACCode(6);
//			console.log(results);
//			if(results.length == 0) {
//				// do nothing
//			} else {
//				var list = new Array();
//				for(var i = 0; i < results.length; i++) {
//					list[i] = results[i].code;
//				}
//				while(contains(list, accode)) {
//					accode = createACCode(6);
//				}
//			}
//			//insert
//			connection.query(activeSQL.createCode, [accode, 0], function(error, results) {
//				if(error) {
//					throw error;
//				} else {
//					res.json({
//						"status": 1,
//						"message": "创建成功",
//						"code": accode
//					});
//				}
//			});
//		}
//	});
//});

module.exports = router;