var map;
var infoWindow;
var geocoder;
var nycBounds;

var origin,
	originMarker,
	destination,
	destinationMarker;

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
		var overlay = new google.maps.OverlayView();
		
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

						// remove NaN
						if(isNaN(ratio)){
							d3.select(this).remove();
						} else{

							if(ratio < 4.5) ratio = 4.5;
							if(ratio > 10)	ratio = 9.5;
							
							d3.select(this).attr("r", ratio);

							if(ratio == 0){
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
	
}

function setDestination(){
	var address = $('#destination').val();
	geocoder.geocode({
		'address': address,
		'bounds': nycBounds,
		'region': 'US'
	}, function(results, status){
		if (status == google.maps.GeocoderStatus.OK) {
			
			// if destination already exists on map, clear it
			if(destinationMarker)
				destinationMarker.setMap(null);
			
			// center point in viewport
	        map.setCenter(results[0].geometry.location);
	        
	        // set marker
			destinationMarker = new google.maps.Marker({
				map: map,
				position: results[0].geometry.location
			});
			
			// set destination value
			$('#destination').val(results[0].formatted_address);
		} else{
			console.log('Geocode not successful bc: '+status);
		}
	});
}

google.maps.event.addDomListener(window, 'load', initialize);

$(window).resize(function(){
	$('#map-canvas').css("height", $(window).height()+"px");
    $('#map-canvas').css("width", $(window).width()+"px");
	google.maps.event.trigger(map, 'resize');
});
