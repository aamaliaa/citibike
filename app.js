
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	hbs = require('hbs'),
	http = require('http'),
	app = express(),
	server = http.createServer(app),
	io = require('socket.io').listen(server),
	path = require('path'),
	fn = require('./functions'),
	citidata = {};

// GRAB DATA
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function(socket) {	
	fn.getStations(function(data){
		citidata.stations = data;
		socket.volatile.emit('update', citidata.stations);
	});

	var stations = setInterval(function() {
		fn.getStations(function(data){
			citidata.stations = data;
			socket.volatile.emit('update', citidata.stations);
		});
	}, 60000);

	socket.on('disconnect', function () {
		clearInterval(stations);
	});
});

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
