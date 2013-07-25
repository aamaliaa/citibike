var App = Em.Application.create({
	//autoinit: false,
	LOG_TRANSITIONS: true
});

App.ApplicationController = Em.Controller.extend();

App.ApplicationView = Em.View.extend({
	templateName: 'appView',
	elementId: 'app'
});

App.MapController = Em.ArrayController.create({
	nycBounds: new google.maps.LatLngBounds(new google.maps.LatLng(40.666577080451354, -74.036865234375), new google.maps.LatLng(40.879775645515764, -73.85078430175781)),
	gMap: null,
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
	getStations: function(){

		console.log('getting stations...');

		var that = App.MapController;
		d3.json('sample.json', function(data){
			that.set('stations', data);
		});

	},
	drawStations: function(){
		console.log('drawing stations...');

		var overlay = this.get('overlay'), // todo: how come "this" doesn't work?
			data = this.get('stations');

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
					.data(d3.entries(data.stationBeanList))
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
					offset: 10, // todo: calculate this depending on radius
					delayIn: 400,
					delayOut: 700,
					title: function(){
						var d = this.__data__;
						return "<div class='stationBubble'><h4>"+d.value.stationName+"</h4><p><dl><dt>status</dt><dd>"+d.value.statusValue+"</dd><dt>available bikes</dt><dd>"+d.value.availableBikes+"</dd><dt>available docks</dt><dd>"+d.value.availableDocks+"</dd><dt>total docks</dt><dd>"+d.value.totalDocks+"</dd></dl></p></div>";
					}
				});

				function transform(d){
					if(d.value !== undefined){
						if(d.value.statusValue !== 'Planned' && d.value.statusValue !== 'Not In Service'){
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

		overlay.setMap(App.MapController.get('gMap'));

	},
	getStationCapacity: function(d){
		if(d.value !== undefined){

			// set radius
			var ratio = d.value.availableBikes;

			// remove NaN, prevent weird floaty markers
			if(isNaN(ratio) || d.value.stationValue == 'Planned' || d.value.stationValue == 'Not In Service'){
				d3.select(this).remove();
			} else{

				if(ratio < 4.5) ratio = 4.5;
				if(ratio > 10)	ratio = 9.5;
				
				d3.select(this).attr("r", ratio);

				if(ratio === 0){
					return d3.select(this).attr("class", "empty");
				} else if(d.value.availableBikes >= 1 && d.value.availableBikes < 5){
					return d3.select(this).attr("class", "caution");
				} else{
					return false;
				}
			}
		} else{
			return false;
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
		
		var map = new google.maps.Map(document.getElementById('map-canvas'), App.MapController.get('mapSettings'));
		
		App.MapController.set('gMap', map);

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

		//App.MapController.getStations();
		google.maps.event.addListenerOnce(App.MapController.get('gMap'), 'tilesloaded', App.MapController.getStations);
	},
	drawStations: function(){
		App.MapController.drawStations();
	}.observes('stations'),
	handleResize: function(){
		google.maps.event.trigger(App.MapController.get('gMap'), 'resize');
	}
});

App.SidebarView = Em.View.extend({
	templateName: 'sidebarView'
});