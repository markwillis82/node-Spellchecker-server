
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.get('/spell', routes.spell);
app.post('/spell', routes.spell);

app.get('/add', routes.addWord);
app.post('/add', routes.addWord);

app.get('/del', routes.delWord);
app.post('/del', routes.delWord);


app.listen(9999);
console.log("Express server listening on port %d in %s mode", 9999,"prod");
