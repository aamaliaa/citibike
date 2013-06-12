Ember.TEMPLATES["appView"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [3,'>= 1.0.0-rc.4'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  


  data.buffer.push("<div id=\"map\">\r\n	<div id=\"map-canvas\"></div>\r\n</div>\r\n	\r\n<div id=\"key\">\r\n	<div class=\"content\">\r\n		<p>Where do you want to go?</p>\r\n		<input id=\"destination\" type=\"text\" placeholder=\"address or location\">\r\n		<input type=\"button\" class=\"btn-primary\" value=\"plot\" onclick=\"setDestination()\">\r\n		<p>Station Info</p>\r\n		<div class=\"content info\"></div>\r\n	</div>\r\n	<!--<div class=\"content\">\r\n		<div class=\"input\"><span class=\"label\">A</span><input type=\"text\"></div>\r\n		<div class=\"input\"><span class=\"label\">B</span><input type=\"text\"></div>\r\n	</div>-->\r\n</div>");
  
});