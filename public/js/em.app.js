var App = Em.Application.create({
	autoinit: false,
	LOG_TRANSITIONS: true
});

App.ApplicationController = Em.Controller.extend();

App.ApplicationView = Em.View.extend({
	templateName: 'appView',
	elementId: 'app'
});

App.initialize();