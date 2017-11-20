var UserSQL = {
	insert:'INSERT INTO User(phone,name,gender,birthday) VALUES (?,?,?,?)',
	queryAll:'SELECT * FROM User',
	getUserByPhone:'SELECT * FROM User WHERE phone = ?'
};
module.exports = UserSQL;