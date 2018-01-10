var UserSQL = {
	insert: 'INSERT INTO User(userid,phone,name,idnumber,gender,birthday,acstatus,regtime,actime,accode) VALUES (?,?,?,?,?,?,?,?,?,?)',
	queryAll: 'SELECT * FROM User',
	getUserByPhone: 'SELECT * FROM User WHERE phone = ?',
	getUserByUserId: 'SELECT * FROM User WHERE userid = ?',
	activeUserByUserid: 'UPDATE User SET acstatus = ?, actime = ? where userid = ?',
	getManagerByUsername: 'SELECT * FROM Manager where username = ?',
	getRealInfo: 'SELECT * FROM UserRealInfo',
	getRealInfoByBatch: 'SELECT * FROM UserRealInfo where batch = ?',
	getRealInfoByPhone: 'SELECT * FROM UserRealInfo where phone = ?',
	getAccodeByPhone: 'SELECT * From User where phone = ?',
	getBatchTime: 'SELECT * From BankAcTime where batch = ?'
};
module.exports = UserSQL;