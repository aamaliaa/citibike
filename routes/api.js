var fs = require('fs'),
	tmp = './tmp',
	archive = './archive',
	MongoClient = require('mongodb').MongoClient,
	dbURL = "mongodb://localhost:27017/citibike";

exports.getStations = function(req, res) {
	MongoClient.connect(dbURL, {w:1}, function(e, db) {
		db.collection('station').find({}, {sort: {_id: 1}}).toArray(function(e, r){
			db.close();
			if (e)
				return console.log(e), res.send(200, {error: 'db error'});
			else {
				r.forEach(function(d) {
					if (d.info.length) {
						d.info.sort(function(x, y) {
							var a = new Date(x.timestamp);
							var b = new Date(y.timestamp);
							if (a < b) return 1;
							else if (a > b) return -1;
							else return 0;
						});
						d.bikesIn = 0,
							d.bikesOut = 0;
						
						for (i=1; i<d.info.length; i++) {
							var diff = d.info[i].availableBikes - d.info[i-1].availableBikes;
							if (diff >= 0) d.bikesOut += diff;
							else d.bikesIn += Math.abs(diff);
						}
						
						d.info = d.info[0];
					}
				});
				r.sort(function(x, y) {
					if (x.bikesIn + x.bikesOut > y.bikesIn + y.bikesOut) return -1;
					else if (x.bikesIn + x.bikesOut < y.bikesIn + y.bikesOut) return 1;
					else return 0;
				});
				res.send(200, r);	
			}
		});
	});
};

exports.getStation = function(req, res) {
	MongoClient.connect(dbURL, {w:1}, function(e, db) {
		if (e) {
			db.close();
			return console.log(e), res.send(200, {error: 'db error'});
		}
		var fields = {};
			
		if (typeof req.query.include == 'string')
			req.query.include.split(',').forEach(function(d) {
				fields[d] = 1;
			});
			
		if (typeof req.query.exclude == 'string')
			req.query.exclude.split(',').forEach(function(d) {
				fields[d] = 0;
			});
			
		db.collection('station').findOne({_id: Number(req.params.id)}, fields, function(e, r){
			db.close();
			if (e)
				return console.log(e), res.send(200, {error: 'db error'});
			else if (r) {
				if (r.info.length) {
					r.info.sort(function(x, y) {
						var a = new Date(x.timestamp);
						var b = new Date(y.timestamp);
						if (a < b) return 1;
						else if (a > b) return -1;
						else return 0;
					});
					r.bikesIn = 0,
						r.bikesOut = 0;
					
					for (i=1; i<r.info.length; i++) {
						var diff = r.info[i].availableBikes - r.info[i-1].availableBikes;
						if (diff >= 0) r.bikesOut += diff;
						else r.bikesIn += Math.abs(diff);
					}
					r.info = r.info[0];
				}
				res.send(200, r);
			}
			else 
				res.send(200, {error: 'not found'});
		});
	});
};

function saveData() {
	fs.readdir(tmp, function(e, files) {
		if (e)
			return console.log(e);
		else if (files.length) {
			MongoClient.connect(dbURL, {w:1}, function(e, db) {
				if (e) {
					db.close();
					return console.log(e);
				}

				var numFiles = files.length,
					savesPending = 0;

				if(numFiles == 0){
					db.close();
					return;
				}
				
				files.forEach(function(file) {
					var oldPath = tmp + "/" + file,
						newPath = archive + "/" + file;
					fs.readFile(oldPath, 'utf8', function(err, data) {
						try {
							var json = JSON.parse(data),
								timestamp = new Date(json.executionTime + ' EDT');
							savesPending += json.stationBeanList.length;
							json.stationBeanList.forEach(function(stat) {
								var obj = stat;
								
								var info = {
									executionTime: timestamp,
									availableDocks: obj.availableDocks,
									totalDocks: obj.totalDocks,
									availableBikes: obj.availableBikes
								};
								var _id = obj.id
								delete obj.id;
								delete obj.availableDocks;
								delete obj.totalDocks;
								delete obj.availableBikes;
								db.collection('station').update({_id: _id}, {$set: obj, $addToSet: {info: info}}, {upsert:true, w:1}, function(){
									savesPending--;
									if(savesPending == 0 && numFiles == 0){
										console.log('closing db');
										db.close();
									}
								});
							});
							fs.rename(oldPath, newPath, function(){
								numFiles--;
								if(savesPending == 0 && numFiles == 0){
									console.log('closing db');
									db.close();
								}
							});
						}
						catch(e){
							db.close();
							return console.log('error occured while saving '+oldPath);
						}
					});
				});
			});
		}
	});
};

saveData();
setInterval(saveData, 60000);