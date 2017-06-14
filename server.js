let express = require('express');
let bodyParser = require('body-parser');
let _ = require('underscore');
let db = require('./db.js')

let app = express();
let PORT = process.env.PORT || 3000;
let todos = [];
let todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res){
	res.send('Todo API Root');
});

app.get('/todos', function(req, res){
	let queryParams = req.query;
	let filteredTodos = todos;

	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true'){
		filteredTodos = _.where(todos, {completed: true});
	} else if(queryParams.hasOwnProperty('completed') && queryParams.completed === 'false'){	
		filteredTodos = _.where(todos, {completed: false});
	}

	if(queryParams.hasOwnProperty('q') && queryParams.q.trim().length > 0){
		filteredTodos = filteredTodos.filter(function(todo){
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
		});
	}
	res.json(filteredTodos);

});

app.get('/todos/:id', function(req, res){
	let todoId = parseInt(req.params.id);
	let matchedTodo = _.findWhere(todos, {id: todoId});
	
	if(matchedTodo){
		res.json(matchedTodo); 
	}
	else{
		res.status(404).send();
	}
});

app.post('/todos', function(req, res){
	let body = _.pick(req.body, "description", "completed");

	db.todo.create(body).then((todo) => {
		res.json(todo.toJSON());
	}, (e) => {
		res.status(400).json(e);
	});
	// if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
	// 	return res.status(400).send();
	// }

	// body.description = body.description.trim();
	// body.id = todoNextId++;
	// todos.push(body);
	// res.send(body);
});

app.delete('/todos/:id', function(req, res){
	let todoId = parseInt(req.params.id);
	let matchedTodo = _.findWhere(todos, {id: todoId});

	if(matchedTodo){
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);

	} else{
		res.status(404).json({"error": "no todo found with that id"});
	}

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

