var CodeSQL = {
	insert:'INSERT INTO IDCode(phone,code,timestamp) VALUES (?,?,?)',
	getCodeByPhone:'SELECT * FROM IDCode WHERE phone = ?',
	changeCodeByPhone:'UPDATE IDCode SET code=? ,timestamp=? where phone=?',
	deleteCodeByPhone:'DELETE FROM IDCode Where phone=?'
};

module.exports = CodeSQL;