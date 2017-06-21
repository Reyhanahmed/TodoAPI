let express = require('express');
let bodyParser = require('body-parser');
let _ = require('underscore');
let crypto = require('crypto-js');
let db = require('./db.js')

let app = express();
let PORT = process.env.PORT || 3000;
let todos = [];

app.use(bodyParser.json());

app.get('/', function(req, res){
	res.send('Todo API Root');
});

app.get('/todos', function(req, res){
	let query = req.query;

	let where = {}; 

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

app.get('/todos/:id', function(req, res){
	let todoId = parseInt(req.params.id);

	db.todo.findById(todoId).then((todo) =>{
		if(todo){
			res.json(todo.toJSON());
		} else{
			res.status(404).send();
		}
	}, (e) => {
		res.status(500).send();
	});

});

app.post('/todos', function(req, res){
	let body = _.pick(req.body, "description", "completed");

	db.todo.create(body).then((todo) => {
		res.json(todo.toJSON());
	}, (e) => {
		res.status(400).json(e);
	});
});

app.delete('/todos/:id', function(req, res){
	let todoId = parseInt(req.params.id);

	db.todo.destroy({
		where: {
			id: todoId
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

app.put('/todos/:id', function(req, res){
	let todoId = parseInt(req.params.id);
	let body = _.pick(req.body, "description", "completed");
	let attributes = {};


	if(body.hasOwnProperty('completed')){
		attributes.completed = body.completed;
	}

	if(body.hasOwnProperty('description')){
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then((todo) => {
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
		res.header('Auth', user.generateToken('authentication')).json(user.toPublicJSON());
	}, (e) => {
		res.status(500).send();
	})

})

db.sequelize.sync().then(function(){
	app.listen(PORT, function(){
		console.log(`Server is running on port ${PORT}`);
	});
});

