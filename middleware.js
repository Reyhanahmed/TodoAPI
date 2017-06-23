let jwt = require('jsonwebtoken');
let crypto = require('crypto-js');
module.exports = function(db){
	
	return {
		requireAuthentication: function(req, res, next){
			let token = req.get('Authorization');
			try{
				let decodedJWT = jwt.verify(token, 'jsonwebtoken');
				let bytes = crypto.AES.decrypt(decodedJWT.payload, 'abc123!@#');
				let tokenData = JSON.parse(bytes.toString(crypto.enc.Utf8));

				db.user.findById(tokenData.id).then(function(user){
					if(user){
						req.user = user;
						next();
					} else{
						res.status(401).send();
					}
				}, function(err){
					console.log(err);
					res.status(401).send();
				})
			} catch(e){
				console.log(e);
				res.status(401).send();
			}
		}
	};
}