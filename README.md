citibike
========

Currently a simple experiment with Ember.js and the Citibike API's single JSON file of station data.

A working example can be found here: [citibike.amaliaviti.com](http://citibike.amaliaviti.com)

It takes an origin and a destination, finds the closest stations to each, and plots bicycle directions between the two stations.

* utilizes the Google Maps API for the map and all geocoding and directions data.
* socket.io for pushing real-time updates to UI

### TO DO:
* provide walking directions between origin/destination points and stations
* hide or change color (gray?) of all other stations when directions are being shown
* show the following information in sidebar:
	* station information for stations selected for plotted route
	* travel time
