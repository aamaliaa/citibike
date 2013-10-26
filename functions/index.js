var	Citibike = require('citibike'),
	citibike = new Citibike;

exports.getStations = function(callback) {
	citibike.getStations(null, function(data){
		console.log("Getting Citibike stations...");
		callback(data);
	});
};