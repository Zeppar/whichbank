var UserSQL = {
	insert: 'INSERT INTO User(userid,phone,name,gender,birthday,acstatus,regtime,actime,accode,faceid) VALUES (?,?,?,?,?,?,?,?,?,?)',
	queryAll: 'SELECT * FROM User',
	getUserByPhone: 'SELECT * FROM User WHERE phone = ?',
	getUserByUserId: 'SELECT * FROM User WHERE userid = ?',
	activeUserByUserid: 'UPDATE User SET acstatus = ?, actime = ? where userid = ?',
	deactiveUserAndUpdateAccode: 'UPDATE User SET acstatus = ?, actime = ?, accode = ? where userid = ?',
	getManagerByUsername: 'SELECT * FROM Manager where username = ?',
	getRealInfo: 'SELECT * FROM UserRealInfo',
	getRealInfoByBatch: 'SELECT * FROM UserRealInfo where batch = ?',
	getRealInfoByPhone: 'SELECT * FROM UserRealInfo where phone = ?',
	getAccodeByPhone: 'SELECT * From User where phone = ?',
	getBatchTime: 'SELECT * From BankAcTime where batch = ?',
	setUserFaceID: 'UPDATE User SET faceid = ? where userid = ?',
	getAllFaceID: "SELECT * From User where faceid <> ''"
};
module.exports = UserSQL;