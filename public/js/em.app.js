var App = Em.Application.create({
	//autoinit: false,
	LOG_TRANSITIONS: true
});

App.ApplicationView = Em.View.extend({
	templateName: 'appView',
	elementId: 'app'
});

App.MapController = Em.Object.create({
	nycBounds: new google.maps.LatLngBounds(new google.maps.LatLng(40.666577080451354, -74.036865234375), new google.maps.LatLng(40.879775645515764, -73.85078430175781)),
	gMap: null,
	stations: null,
	mapSettings: {
		center: new google.maps.LatLng(40.73492695, -73.99200509),
		zoom: 13,
		maxZoom: 18,
		minZoom: 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false,
		streetViewControl: false,
		backgroundColor: '#ffffff'
	},
	bikeLayer: null,
	geocoder: null,
	directionsRenderer: null,
	directionsService: null,
	overlay: null,
	origin: {
		object: null,
		latLng: null,
		closestStation: null
	},
	destination: {
		object: null,
		latLng: null,
		closestStation: null
	},
	getPosition: function(){
		if(!navigator.geolocation){
			console.log('Geolocation is not supported by browser.');
			return false;
		}

		console.log('getting position...');

		this.set('origin.object', navigator.geolocation.getCurrentPosition(
			function(position){
				var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

				App.MapController.setOrigin(point);

				return point;
			}, function(){
				console.log('Unable to retrieve your location');
				return false;
			})
		);
	},
	setOrigin: function(origin){
		var self = this,
			geocodeSettings,
			num;

		// switches geocoder settings depending on origin input type
		if(origin.lb !== undefined){
			geocodeSettings = {
				'latLng': origin
			};
			num = 1;
		} else{
			geocodeSettings = {
				'address': origin,
				'bounds': self.get('nycBounds'),
				'region': 'US'
			};
			num = 0;
		}

		self.geocoder.geocode(geocodeSettings, function(results, status){
			if(status === google.maps.GeocoderStatus.OK){
				self.set('origin.object', results[num].formatted_address);
				self.set('origin.latLng', results[num].geometry.location);
			}else{
				console.log('Geocode unsuccessful because: '+status);
			}
		});
	},
	setDestination: function(){
		var self = this,
			dest = self.get('destination.object');

		self.geocoder.geocode({
			'address': dest,
			'bounds': self.get('nycBounds'),
			'region': 'US'
		}, function(results, status){
			if(status === google.maps.GeocoderStatus.OK){
				self.set('destination.object', results[0].formatted_address);
				self.set('destination.latLng', results[0].geometry.location);

				self.calculateRoute();

			} else{
				console.log('Geocode unsuccessful because: '+status);
			}
		});
	},
	getStations: function(){
		console.log('getting stations...');

		var that = App.MapController;
		d3.json('/json/stationData', function(data){
			that.set('stations', data);
		});
	},
	drawStations: function(){
		console.log('drawing stations...');

		var overlay = this.get('overlay'),
			data = this.get('stations').results;

	// TODO: CLEAN THIS UP
		overlay.setMap(null);
		
		$('svg circle').remove();

		overlay = new google.maps.OverlayView();

		// add container when overlay is added to map
		overlay.onAdd = function(){
			var layer = d3.select(this.getPanes().overlayMouseTarget).append('div')
				.attr('class', 'stations');

			var that = this;

			// draw each marker as separate SVG element
			overlay.draw = function(){
				var projection = that.getProjection(),
					padding = 10;

				var marker = layer.selectAll('svg')
					.data(d3.entries(data))
					.each(transform) // update existing markers
					.enter().append('svg:svg')
					.each(transform)
					.attr('class', 'marker');

				// add a circle
				marker.append('svg:circle')
					.attr('r', 7)
					.attr('cx', padding)
					.attr('cy', padding)
					.each(App.MapController.getStationCapacity);

				// set tipsy tooltips
				$('svg circle').tipsy({
					gravity: 's',
					html: true,
					fade: true,
					opacity: 0.9,
					offset: padding, // todo: calculate this depending on radius
					delayIn: 400,
					delayOut: 700,
					title: function(){
						var d = this.__data__;
						return "<div class=\"stationBubble\"><h4>"+d.value.label+"</h4><p><dl><dt>status</dt><dd>"+d.value.status+"</dd><dt>available bikes</dt><dd>"+d.value.availableBikes+"</dd><dt>available docks</dt><dd>"+d.value.availableDocks+"</dd></dl></p></div>";
					}
				});

				var mouseOn = function(){
					var circle = d3.select(this);

					circle.transition()
						.duration(800);
						// do something
				}

				var mouseOff = function(){
					var circle = d3.select(this);

					circle.transition()
						.duration(800);
						// make it go back
				}

				$('svg circle').on("mouseover", mouseOn);
				$('svg circle').on("mouseout", mouseOff);

				function transform(d){
					if(d.value !== undefined){
						if(d.value.status !== 'Planned' && d.value.status !== 'Not In Service'){
							d = new google.maps.LatLng(d.value.latitude, d.value.longitude);
							d = projection.fromLatLngToDivPixel(d);

							return d3.select(this)
								.style("left", (d.x - padding) + "px")
								.style("top", (d.y - padding) + "px");
						} else {
							return false;
						}
					} else{
						return false;
					}
				}

			};
		};

		// bind overlay to map
		overlay.setMap(App.MapController.get('gMap'));
	},
	setRadius: function(d){
		if(d.value !== undefined || /^\d*$/i.test(d.key)){
			var ratio = d.value.availableBikes;

			if(ratio < 4.5) ratio = 4.5;
			if(ratio > 9) ratio = 9;

			return d3.select(this).attr('r', ratio);
		} else{
			return false;
		}
	},
	getStationCapacity: function(d){
		if(d.value !== undefined || /^\d*$/i.test(d.key)){
			// set radius
			var ratio = d.value.availableBikes;

			// remove NaN, prevent weird floaty markers
			if(isNaN(ratio) || d.value.station === 'Planned' || d.value.station === 'Not In Service'){
				d3.select(this).remove();
			} else{

				if(ratio < 4.5) ratio = 4.5;
				if(ratio > 9)	ratio = 9;
				
				d3.select(this).attr("r", ratio);

				if(d.value.availableBikes === 0){
					return d3.select(this).attr("class", "empty");
				} else if(d.value.availableBikes > 0 && d.value.availableBikes < 5){
					return d3.select(this).attr("class", "caution");
				} else{
					return false;
				}
			}
		} else{
			d3.select(this).remove();
			return false;
		}
	},
	calculateRoute: function(){
		var self = this,
			origin = self.get('origin.latLng'),
			destination = self.get('destination.latLng'),
			request;

		// iterate thru all stations and find closest to origin/destination
		$.each(self.get('stations').results, function(){

			this.distOrigin = self.getDistance(this.latitude, this.longitude, origin.lb, origin.mb);
			this.distDest = self.getDistance(this.latitude, this.longitude, destination.lb, destination.mb);

			if(self.get('origin.closestStation') === null){
				self.set('origin.closestStation', this);
			}

			if(self.get('destination.closestStation') === null){
				self.set('destination.closestStation', this);
			}

			if(this.distOrigin < self.get('origin.closestStation.distOrigin')){
				self.set('origin.closestStation', this);
			}

			if(this.distDest < self.get('destination.closestStation.distDest')){
				self.set('destination.closestStation', this);
			}

		});

		request = {
			origin: new google.maps.LatLng(self.get('origin.closestStation.latitude'), self.get('origin.closestStation.longitude')),
			destination: new google.maps.LatLng(self.get('destination.closestStation.latitude'), self.get('destination.closestStation.longitude')),
			travelMode: google.maps.TravelMode['BICYCLING']
		};

		self.get('directionsService').route(request, function(response, status){
			if(status === google.maps.DirectionsStatus.OK){
				self.get('directionsRenderer').setDirections(response);
			}
		});
	},
	// found here: http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
	getDistance: function(lat1, lon1, lat2, lon2){
		var R = 6371; // Radius of the earth in km
		var dLat = deg2rad(lat2-lat1);  // deg2rad below
		var dLon = deg2rad(lon2-lon1); 
		var a = 
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
			Math.sin(dLon/2) * Math.sin(dLon/2)
			; 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var d = R * c; // Distance in km
		return d;

		function deg2rad(deg) {
			return deg * (Math.PI/180);
		}
	}
});

App.MapView = Em.View.extend({
	templateName: 'mapView',
	stationsBinding: 'App.MapController.stations',
	didInsertElement: function(){
		// set height and width
		$('#map-canvas').css("height", $(window).height()+"px");
		$('#map-canvas').css("width", $(window).width()+"px");

		google.maps.visualRefresh = true; // new gmaps style
		
		// set map in MapController
		var map = new google.maps.Map(document.getElementById('map-canvas'), App.MapController.get('mapSettings'));
		App.MapController.set('gMap', map);

		// set gmaps vars in MapController
		var maps_vars = {
			bikeLayer: new google.maps.BicyclingLayer(),
			geocoder: new google.maps.Geocoder(),
			directionsRenderer: new google.maps.DirectionsRenderer(),
			directionsService: new google.maps.DirectionsService(),
			overlay: new google.maps.OverlayView()
		};

		for(var name in maps_vars){
			App.MapController.set(name, maps_vars[name]);
		}

		App.MapController.get('bikeLayer').setMap(App.MapController.get('gMap'));
		App.MapController.get('directionsRenderer').setMap(App.MapController.get('gMap'));

		// getStations when map is loaded
		google.maps.event.addListenerOnce(App.MapController.get('gMap'), 'tilesloaded', App.MapController.getStations);
	},
	drawStations: function(){
		// observes 'stations' and redraws overlay on map when they change
		App.MapController.drawStations();

		// get device position
		App.MapController.getPosition();
	}.observes('stations'),
	handleResize: function(){
		// handles the window/map resize
		google.maps.event.trigger(App.MapController.get('gMap'), 'resize');
	}
});

App.SidebarView = Em.View.extend({
	templateName: 'sidebarView',
	lastUpdateBinding: 'App.MapController.stations.lastUpdate',
	updated: function(){ // TODO http://jgwhite.co.uk/2013/06/08/ember-time.html
		if(this.get('lastUpdate') !== null){
			return moment(this.get('execTime')).fromNow();
		}
	}.property('lastUpdate')
});

App.FormView = Em.View.extend({
	tagName: 'form',
	originBinding: 'App.MapController.origin.object',
	destinationBinding: 'App.MapController.destination.object',
	submit: function(e){
		e.preventDefault();
		App.MapController.setDestination();
	}
});

App.OriginField = Em.TextField.extend({
	originBinding: 'App.MapController.origin.object',
	focusOut: function(){
		if(this.get('origin') !== undefined){
			App.MapController.setOrigin(this.get('origin'));
		}
	}
});

// handle window resize
$(window).resize(function(){
	$('#map-canvas').css("height", $(window).height()+"px");
	$('#map-canvas').css("width", $(window).width()+"px");
	App.MapView.handleResize;
});
