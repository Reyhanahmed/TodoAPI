let jwt = require('jsonwebtoken');
let crypto = require('crypto-js');
module.exports = function(db){
	
	return {
		requireAuthentication: function(req, res, next){
			let token = req.get('Authorization').split(" ")[1] || "";

			db.token.findOne({
				where: {
					tokenHash: crypto.MD5(token).toString()
				}
			}).then((tokenInstance) => {
				if(!tokenInstance){
					throw new Error();
				}
				req.token = tokenInstance;

				try{
					let decodedJWT = jwt.verify(token, 'jsonwebtoken');
					let bytes = crypto.AES.decrypt(decodedJWT.payload, 'abc123!@#');
					let tokenData = JSON.parse(bytes.toString(crypto.enc.Utf8));

					return db.user.findById(tokenData.id);
				} catch(e){
					console.log(e);
					res.status(401).send();
				}

			}).then((user) => {
				if(user){
					req.user = user;
					next();
				} else{
					res.status(401).send();
				}
			}, function(err){
				console.log(err);
				res.status(401).send();
			}).catch((e) =>{
				res.status(401).send()
			});
			
		}
	}
}