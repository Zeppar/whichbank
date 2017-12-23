var express = require('express');
var router = express.Router();
var qr_image = require("qr-image");

router.get('/show', function(req, res, next) {
	console.log('show');
	var temp_qrcode = qr_image.image(req.session.user.userid, {size: 6, margin: 1});
		res.type("png");
		temp_qrcode.pipe(res);
});

module.exports = router;