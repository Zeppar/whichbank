var ActiveSQL = {	
	changeCodeStatus: 'UPDATE ACCode SET status=? where code=?',
	getCode:'SELECT * FROM ACCode WHERE code = ?',
	createCode:'INSERT INTO ACCode (code, status) VALUES (?,?)',
	getAllCode: 'SELECT * FROM ACCode'
};
module.exports = ActiveSQL;