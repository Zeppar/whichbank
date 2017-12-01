var UserSQL = {
	insert:'INSERT INTO User(userid,phone,name,idnumber,gender,birthday) VALUES (?,?,?,?,?,?)',
	queryAll:'SELECT * FROM User',
	getUserByPhone:'SELECT * FROM User WHERE phone = ?',
	getUserByUserId:'SELECT * FROM User WHERE userid = ?'
};

module.exports = UserSQL;