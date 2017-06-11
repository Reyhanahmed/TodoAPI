var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [{
	id: 1,
	description: 'Meet father for lunch',
	completed: false
}, {
	id: 2,
	description: 'Go to market',
	completed: false
}, {
	id: 3,
	description: 'Feed the cat',
	completed: true
}];

app.get('/', function(req, res){
	res.send('Todo API Root');
});

app.get('/todos', function(req, res){
	res.json(todos);
});

app.get('/todos/:id', function(req, res){
	var matchedTodo;
	
	todos.forEach(function(todo){
		if (parseInt(req.params.id) === todo.id){
			matchedTodo = todo;
		}
	})
	
	if(matchedTodo){
		res.json(matchedTodo); 
	}
	else{
		res.status(404).send();
	}
});

app.listen(PORT, function(){
	console.log(`Server is running on port ${PORT}`);
})