var express = require("express"),
	router = new express.Router();

router.use('/', require('./web/web_router'));
router.use('/api', require('./api/api_router'));


module.exports = router;