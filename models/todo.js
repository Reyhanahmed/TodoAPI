let _ = require('underscore');
module.exports = (sequelize, DataTypes) => {
	console.log(DataTypes.BOOLEAN);
	return sequelize.define('todo', {
		description: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 250],
				isString: function(val){
					if(!_.isString(val)){
						throw new Error('Description must be a string');
					}
				}
			}
		},
		completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			validate: {
				isBoolean: function(val){
					if(!_.isBoolean(val)){
						throw new Error('Completed must be a boolean');
					}
				}
			}
		}
	});
};
