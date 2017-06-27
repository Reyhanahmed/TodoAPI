let crypto = require('crypto-js');

module.exports = function(sequelize, DataTypes){
	return sequelize.define('token', {
		token: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [1]
			},
			set: function(val){
				let hash = crypto.MD5(val).toString();
				this.setDataValue('token', val);
				this.setDataValue('tokenHash', hash);
			}
		},
		tokenHash: DataTypes.STRING
	});
}