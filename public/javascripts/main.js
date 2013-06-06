var map;
var infoWindow;
var markersArray = [];
var infoWindowsArray = [];

function initialize() {
	var mapDiv = document.getElementById('map-canvas');
	$('#map-canvas').css("height", $(window).height()+"px");
    $('#map-canvas').css("width", $(window).width()+"px");
    
    var position = getPosition();
    google.maps.visualRefresh = true; // new gmaps style
    
	map = new google.maps.Map(mapDiv, {
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
		map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
		return true;
	}
	
	function error() {
		alert("Unable to retrieve your location");
		return false;
	}
	
	return navigator.geolocation.getCurrentPosition(success, error);
}

function addMarkers() {
	$.getJSON('http://dev.amaliaviti.com/citibike/stationData/current', function(data){
	    $.each(data.stationBeanList, function(index, station){
	    	if(station.statusValue != 'De-Registered' && station.statusValue != 'Planned'){
		    	var icon;
		    	var isEmpty = (station.availableBikes < 1) ? true : false;
		    	
				var html = "<div class='stationBubble'><h4>"+station.stationName+"</h4><p><dl><dt>status</dt><dd>"+station.statusValue+"</dd><dt>available bikes</dt><dd>"+station.availableBikes+"</dd><dt>available docks</dt><dd>"+station.availableDocks+"</dd><dt>total docks</dt><dd>"+station.totalDocks+"</dd></dl></p></div>";
				
				if(isEmpty){
					icon = 'http://maps.google.com/mapfiles/ms/icons/red.png';
				} else if(station.availableBikes < 5){
					icon = 'http://maps.google.com/mapfiles/ms/icons/yellow.png';
				} else{
					icon = 'http://maps.google.com/mapfiles/ms/icons/blue.png';
				}
				
				var latLng = new google.maps.LatLng(station.latitude, station.longitude);
				var marker = new google.maps.Marker({
					icon: icon,
					position: latLng,
					map: map,
					labelClass: "labels",
					animation: google.maps.Animation.DROP,
					html: html
				});
				
				markersArray.push(marker);
				
				google.maps.event.addListener(marker, 'click', function() {					
					infoWindow.setContent(this.html);
					infoWindow.open(map, this);
			    });
		    }
	    });
	});
}

google.maps.event.addDomListener(window, 'load', initialize);

$(window).resize(function(){
	$('#map-canvas').css("height", $(window).height()+"px");
    $('#map-canvas').css("width", $(window).width()+"px");
	google.maps.event.trigger(map, 'resize');
});