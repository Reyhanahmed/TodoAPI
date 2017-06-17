let crypto = require('crypto-js');
let _ = require('underscore');
let easypbkdf2 = require('easy-pbkdf2')();


module.exports = function(sequelize, DataTypes){
	let User = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		//Salt is used to add random characters in the end of passwords so that no two passwords can have 
		//same hashes so that no one can identify the same passwords
		salt: DataTypes.STRING,
		password_hash: DataTypes.STRING,
		password: {
			// VIRTUAL datatype is not save in database but used in the code
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 20]
			},
			set: function(val){
				let salt = easypbkdf2.generateSalt();
				let hashedPassword = crypto.SHA256(val + "" + salt);
				this.setDataValue('password', val);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword.toString());
			}
		}
	}, {
		// Hooks are used at specific events
		hooks: {
			beforeValidate: (user, options) => {
				if(typeof user.email === 'string'){
					user.email = user.email.toLowerCase();
				}
			}
		},
		
	});

	// Define Instance Method on User Model
	User.prototype.toPublicJSON = function(){
		let json = this.toJSON();
		return _.pick(json, "id", "email", "createdAt", "updatedAt");
	}

	return User;
}