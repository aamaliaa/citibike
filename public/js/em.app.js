var App = Em.Application.create({
	autoinit: false,
	LOG_TRANSITIONS: true
});

App.ApplicationController = Em.Controller.extend();

App.ApplicationView = Em.View.extend({
	templateName: 'appView',
	elementId: 'app'
});

App.MapController = Em.Object.create({
	nycBounds: new google.maps.LatLngBounds(new google.maps.LatLng(40.666577080451354, -74.036865234375), new google.maps.LatLng(40.879775645515764, -73.85078430175781)),
	map: {
		center: new google.maps.LatLng(40.73492695, -73.99200509),
		zoom: 13,
		maxZoom: 18,
		minZoom: 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false,
		streetViewControl: false,
		backgroundColor: '#ffffff'
	}
});

App.MapView = Em.View.extend({
	templateName: 'mapView',
	map: null,
	bikeLayer: null,
	geocoder: null,
	directionsRenderer: null,
	directionsService: null,
	overlay: null,
	didInsertElement: function(){
		// set height and width
		$('#map-canvas').css("height", $(window).height()+"px");
		$('#map-canvas').css("width", $(window).width()+"px");

		google.maps.visualRefresh = true; // new gmaps style
		
		var map = new google.maps.Map(document.getElementById('map-canvas'), App.MapController.get('map'));
		
		this.set('map', map);

		var maps_vars = {
			bikeLayer: new google.maps.BicyclingLayer(),
			geocoder: new google.maps.Geocoder(),
			directionsRenderer: new google.maps.DirectionsRenderer(),
			directionsService: new google.maps.DirectionsService(),
			overlay: new google.maps.OverlayView()
		};

		for(var name in maps_vars){
			this.set(name, maps_vars[name]);
		}

		this.get('bikeLayer').setMap(this.get('map'));
		this.get('directionsRenderer').setMap(this.get('map'));

		//google.maps.event.addListenerOnce(this.get('map'), 'tilesloaded', App.MapController.addMarkers);
	},
	handleResize: function(){
		google.maps.event.trigger(this.get('map'), 'resize');
	}
});

App.SidebarView = Em.View.extend({
	templateName: 'sidebarView'
});