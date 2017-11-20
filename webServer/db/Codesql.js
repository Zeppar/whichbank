var CodeSQL = {
	insert:'INSERT INTO IDCode(phone,code) VALUES (?,?)',
	getCodeByPhone:'SELECT * FROM IDCode WHERE phone = ?',
	changeCodeByPhone:'UPDATE IDCode SET code=? where phone=?',
	deleteCodeByPhone:'DELETE FROM IDCode Where phone=?'
};
module.exports = CodeSQL;