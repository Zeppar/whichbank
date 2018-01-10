var ActiveSQL = {	
	changeCodeStatus: 'UPDATE ACCode SET status=1 where code=?',
	getCode:'SELECT * FROM ACCode WHERE code = ?',
	createCode:'INSERT INTO ACCode (code, status) VALUES (?,?)',
	getAllCode: 'SELECT * FROM ACCode',
	getCodeByCardId: 'SELECT * FROM ACCode WHERE cardid = ?'
};
module.exports = ActiveSQL;