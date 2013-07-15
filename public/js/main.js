var map;
var stationData;
var infoWindow;
var geocoder;
var nycBounds;

var origin,
	originMarker,
	destination,
	destinationMarker;

var directionsDisplay;

var directionsService = new google.maps.DirectionsService();
var overlay = new google.maps.OverlayView();

var markersArray = [];
var infoWindowsArray = [];

function initialize() {
	var mapDiv = document.getElementById('map-canvas');
	$('#map-canvas').css("height", $(window).height()+"px");
	$('#map-canvas').css("width", $(window).width()+"px");
	
	getPosition();
	
	nycBounds = new google.maps.LatLngBounds(new google.maps.LatLng(40.666577080451354, -74.036865234375), new google.maps.LatLng(40.879775645515764, -73.85078430175781));
	
	google.maps.visualRefresh = true; // new gmaps style
	
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(d3.select(mapDiv).node(), {
		center: new google.maps.LatLng(40.73492695, -73.99200509),
		zoom: 13,
		maxZoom: 18,
		minZoom: 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false,
		streetViewControl: false,
		backgroundColor: '#ffffff'
	});
	
	bikeLayer = new google.maps.BicyclingLayer();
	bikeLayer.setMap(map);
	
	infoWindow = new google.maps.InfoWindow({
		content: 'loading...'
	});

	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);
	
	google.maps.event.addListenerOnce(map, 'tilesloaded', addMarkers);

}

function getPosition() {
	if (!navigator.geolocation) {
		alert("Geolocation is not supported by your browser");
		return false;
	}
	
	function success(position) {
		var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		setOrigin(point);
		return point;
	}
	
	function error() {
		alert("Unable to retrieve your location");
		return false;
	}
	
	return navigator.geolocation.getCurrentPosition(success, error);
}

function addMarkers() {
	// d3 implementation
	d3.json('sample.json', function(data){

		stationData = data;
		
		// add container when overlay is added to map
		overlay.onAdd = function(){
			var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
				.attr("class", "stations");
		
			// draw each marker as separate SVG element
			overlay.draw = function(){
				var projection = this.getProjection(),
					padding = 10;
				
				var marker = layer.selectAll("svg")
					.data(d3.entries(data.stationBeanList))
					.each(transform) // update existing markers
					.enter().append("svg:svg")
					.each(transform)
					.attr("class", "marker");

				// add a circle
				marker.append("svg:circle")
					.attr("r", 7)
					.attr("cx", padding)
					.attr("cy", padding)
					.each(stationCapacity);

				// set tipsy tooltips
				$('svg circle').tipsy({
					gravity: 's',
					html: true,
					fade: true,
					opacity: 0.9,
					offset: 10, // todo: calculate this depending on circle radius
					delayIn: 400,
					delayOut: 700,
					title: function() {
						var d = this.__data__;
						return "<div class='stationBubble'><h4>"+d.value.stationName+"</h4><p><dl><dt>status</dt><dd>"+d.value.statusValue+"</dd><dt>available bikes</dt><dd>"+d.value.availableBikes+"</dd><dt>available docks</dt><dd>"+d.value.availableDocks+"</dd><dt>total docks</dt><dd>"+d.value.totalDocks+"</dd></dl></p></div>";
					}
				});

				function stationCapacity(d){
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
		
		// bind overlay to map
		overlay.setMap(map);

	});
}

function setOrigin(point){

	if(originMarker) originMarker.setMap(null);
	
	origin = point;
	
	map.setCenter(point);
	originMarker = new google.maps.Marker({
		map: map,
		position: point,
		zIndex: 999
	});

	// update origin input box
	geocoder.geocode({
		'latLng': point
	}, function(results, status){
		if (status == google.maps.GeocoderStatus.OK) {
			$('#origin').val(results[1].formatted_address);
		} else {
			console.log('Geocode not successful bc: '+status);
		}
	});
	
}

function setDestination(){
	var address = $('#destination').val();
	geocoder.geocode({
		'address': address,
		'bounds': nycBounds,
		'region': 'US'
	}, function(results, status){
		if (status == google.maps.GeocoderStatus.OK) {
			
			destination = results[0].geometry.location;

			// if destination already exists on map, clear it
			if(destinationMarker)
				destinationMarker.setMap(null);

			// set marker
			destinationMarker = new google.maps.Marker({
				map: map,
				position: destination
			});

			// set destination value
			$('#destination').val(results[0].formatted_address);

			calculateRoute();

		} else{
			console.log('Geocode not successful bc: '+status);
		}
	});
}

function calculateRoute(){

	var mode = 'BICYCLING';

	var closestOrigin, closestDestination;

	$.each(stationData.stationBeanList, function(){
		if(closestOrigin == null){
			closestOrigin = this;
		}

		if(closestDestination == null){
			closestDestination = this;
		}

		this.distOrigin = getDistance(this.latitude, this.longitude, origin.jb, origin.kb);
		this.distDest = getDistance(this.latitude, this.longitude, destination.jb, destination.kb);

		if(this.distOrigin < closestOrigin.distOrigin){
			closestOrigin = this;
		}

		if(this.distDest < closestDestination.distDest){
			closestDestination = this;
		}

	});

	var request = {
		origin: new google.maps.LatLng(closestOrigin.latitude, closestOrigin.longitude),
		destination: new google.maps.LatLng(closestDestination.latitude, closestDestination.longitude),
		travelMode: google.maps.TravelMode[mode]
	};
	
	directionsService.route(request, function(response, status){
		if(status == google.maps.DirectionsStatus.OK){
			directionsDisplay.setDirections(response);
		}
	});

}

// found here: http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
function getDistance(lat1,lon1,lat2,lon2) {
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
}

function deg2rad(deg) {
	return deg * (Math.PI/180)
}

google.maps.event.addDomListener(window, 'load', initialize);

$(window).resize(function(){
	$('#map-canvas').css("height", $(window).height()+"px");
	$('#map-canvas').css("width", $(window).width()+"px");
	google.maps.event.trigger(map, 'resize');
});
