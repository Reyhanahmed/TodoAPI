let express = require('express');
let bodyParser = require('body-parser');
let _ = require('underscore');
let crypto = require('crypto-js');
let expressJWT = require('express-jwt');
let db = require('./db.js');

let {requireAuthentication} = require('./middleware')(db);

// let requireAuthentication = (req, res, next) => {
// 	next();
// }

let app = express();
let PORT = process.env.PORT || 3000;
let todos = [];

app.use(bodyParser.json());
app.use(expressJWT({secret: 'jsonwebtoken'}).unless({path: ["/users", "/users/login"]}));

// setting security middleware
app.use(helmet());

app.get('/', function(req, res){
	res.send('Todo API Root');
});

app.get('/todos', requireAuthentication, function(req, res){
	let query = req.query;
	let where = {
		userId: req.user.get('id')
	}; 

	 if (query.hasOwnProperty('completed') && query.completed === 'true'){
	 	where.completed = true;
	 } else if(query.hasOwnProperty('completed') && query.completed === 'false'){
	 	where.completed = false;	
	 }

	 if(query.hasOwnProperty('q') && query.q.trim().length > 0){
	 	where.description = {
	 		$like: '%' + query.q + '%'
	 	};
	 }

	db.todo.findAll({ where }).then((todos) => {
		res.json(todos);
	}, (e) => {
		res.status(500).send();
	});
});

app.get('/todos/:id', requireAuthentication, function(req, res){
	let todoId = parseInt(req.params.id);
	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then((todo) =>{
		if(todo){
			res.json(todo.toJSON());
		} else{
			res.status(404).send();
		}
	}, (e) => {
		res.status(500).send();
	});

});

app.post('/todos', requireAuthentication, function(req, res){
	let body = _.pick(req.body, "description", "completed");

	db.todo.create(body).then((todo) => {
		req.user.addTodo(todo).then(() => {
			return todo.reload()
		}).then((todo) => {
			res.json(todo.toJSON());
		});
	}, (e) => {
		res.status(400).json(e);
	});
});

app.delete('/todos/:id', requireAuthentication, function(req, res){
	let todoId = parseInt(req.params.id);

	db.todo.destroy({
		where: {
			id: todoId,
			userId: req.user.get(id)
		}
	}).then((rowsDeleted) => {
		if(rowsDeleted === 0){
			res.status(404).json({
				error: 'No todo with id'
			});
		} else{
			res.status(204).send();
		}
	}, () => {
		res.status(500).send();
	});
});

app.put('/todos/:id', requireAuthentication, function(req, res){
	let todoId = parseInt(req.params.id);
	let body = _.pick(req.body, "description", "completed");
	let attributes = {};


	if(body.hasOwnProperty('completed')){
		attributes.completed = body.completed;
	}

	if(body.hasOwnProperty('description')){
		attributes.description = body.description;
	}

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then((todo) => {
		if(todo){
			return todo.update(attributes).then((todo) => {
				res.json(todo.toJSON());
			}, (e) => {
				res.status(400).json(e);
			});
		} else{
			res.status(404).send();
		}
	}, () => {
		res.status(500).send();
	});
});


/*------------ USER ROUTES --------------*/

app.post('/users', (req, res) => {
	let body = _.pick(req.body, "email", "password");

	db.user.create(body).then((user) => {
		res.json(user.toPublicJSON());
	}, (e) => {
		res.status(400).json(e);
	});
});

app.post('/users/login', (req, res) => {
	let body = _.pick(req.body, "email", "password");
	let userInstance;

	if(typeof body.email !== 'string' || typeof body.password !== 'string'){
		res.status(400).send();
	}

	db.user.findOne({
		where: {
			email: body.email
		}
	}).then((user) => {
		if(!user){
			return res.status(401).send();
		}
		
		let hash = crypto.SHA256(body.password+""+user.get('salt'));
		if(user.get('password_hash') !== hash.toString()){
			return res.status(401).send();
		} 

		let token = user.generateToken('authentication');
		userInstance = user;
		return db.token.create({
			token
		});
	
	}).then((tokenInstance) => {
		res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
	}).catch((e) => {
		res.status(500).send();
	});

});

app.post('/users/logout', requireAuthentication, (req, res) => {
	req.token.destroy().then(() => {
		res.status(204).send();
	}).catch(() => {
		res.status(500).send();
	})
});

db.sequelize.sync({force: true}).then(function(){
	app.listen(PORT, function(){
		console.log(`Server is running on port ${PORT}`);
	});
});

