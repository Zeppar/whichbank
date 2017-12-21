var UserSQL = {
	insert: 'INSERT INTO User(userid,phone,name,idnumber,gender,birthday,acstatus) VALUES (?,?,?,?,?,?,?)',
	queryAll: 'SELECT * FROM User',
	getUserByPhone: 'SELECT * FROM User WHERE phone = ?',
	getUserByUserId: 'SELECT * FROM User WHERE userid = ?',
	activeUserByUserid: 'UPDATE User SET acstatus = ？ where userid = ?',
	getManagerByUsername: 'SELECT * FROM Manager where username = ?'
};
module.exports = UserSQL;