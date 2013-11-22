
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	hbs = require('hbs'),
	http = require('http'),
	app = express(),
	server = http.createServer(app),
	path = require('path'),
	fn = require('./functions'),
	citidata = {};

app.configure(function(){
	app.set('port', process.env.PORT || 3002);
	app.engine('hbs', hbs.__express);
	app.set('view engine', 'hbs');
	app.set('views', __dirname + '/views');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
	app.use(function(req, res, next){
		res.send(404, {
			error: 'Sorry can\'t find that!'
		});
	});
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

// ROUTES

app.get('/', routes.index);

app.get('/json/stationData', function(req, res){
	var data = citidata.stations;
	res.json(data);
});
 
server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({server: server});

// GRAB DATA
wss.on('connection', function(ws) {
	fn.getStations(function(data){
		citidata.stations = data;
		ws.send(JSON.stringify(citidata.stations));
	});

	var stations = setInterval(function() {
		fn.getStations(function(data){
			citidata.stations = data;
			ws.send(JSON.stringify(citidata.stations));
		});
	}, 60000);
});