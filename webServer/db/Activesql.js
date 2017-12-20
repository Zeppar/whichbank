var ActiveSQL = {	
	deleteCode: 'DELETE FROM ACCode Where code = ?',
	getCode:'SELECT * FROM ACCode WHERE phone = ?',
};
module.exports = ActiveSQL;