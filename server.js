let express = require('express');
let bodyParser = require('body-parser');
let _ = require('underscore');
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
	let matchedTodo = _.findWhere(todos, {id: todoId});
	let body = _.pick(req.body, "description", "completed");
	let validAttributes = {};

	if(!matchedTodo){
		return res.status(404).send();	
	}

	if(body.hasOwnProperty('completed') && _.isBoolean(body.completed)){
		validAttributes.completed = body.completed;
	} else if(body.hasOwnProperty('completed')){
		return res.status(400).send();
	} 

	if(body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0){
		validAttributes.description = body.description;
	} else if(body.hasOwnProperty('description')){
		return res.status(400).send();
	}

	_.extend(matchedTodo, validAttributes);
	res.json(matchedTodo);

});

db.sequelize.sync().then(function(){
	app.listen(PORT, function(){
		console.log(`Server is running on port ${PORT}`);
	});
});

