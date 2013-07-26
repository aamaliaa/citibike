Ember.TEMPLATES["appView"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [3,'>= 1.0.0-rc.4'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', hashTypes, hashContexts, escapeExpression=this.escapeExpression;


  data.buffer.push("<div id=\"map\">");
  hashTypes = {};
  hashContexts = {};
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "App.MapView", {hash:{},contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
  data.buffer.push("</div>\r\n<div id=\"key\">");
  hashTypes = {};
  hashContexts = {};
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "App.SidebarView", {hash:{},contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
  data.buffer.push("</div>");
  return buffer;
  
});

Ember.TEMPLATES["mapView"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [3,'>= 1.0.0-rc.4'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  


  data.buffer.push("<div id=\"map-canvas\"></div>");
  
});

Ember.TEMPLATES["sidebarView"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [3,'>= 1.0.0-rc.4'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', hashContexts, hashTypes, escapeExpression=this.escapeExpression;


  data.buffer.push("<div class=\"content\">\n	<p>Where do you want to go?</p>\n	<p>from</p>\n	<div class=\"input\">\n		<span class=\"label\">A</span>\n		");
  hashContexts = {'id': depth0,'valueBinding': depth0,'placeholder': depth0};
  hashTypes = {'id': "STRING",'valueBinding': "STRING",'placeholder': "STRING"};
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "Em.TextField", {hash:{
    'id': ("origin"),
    'valueBinding': ("view.formattedOrigin"),
    'placeholder': ("address or location")
  },contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
  data.buffer.push("\n	</div>\n	<p>to</p>\n	<div class=\"input\"><span class=\"label\">B</span><input id=\"destination\" type=\"text\" placeholder=\"address or location\"></div>\n	<input type=\"button\" class=\"btn-primary\" value=\"plot\" onclick=\"setDestination()\">\n\n</div>");
  return buffer;
  
});