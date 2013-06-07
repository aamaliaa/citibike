module.exports = function(grunt){

	'use strict';

	grunt.initConfig({

		watch: {
			files: 'views/templates/*.hbs',
			tasks: 'ember_templates'
		},
		// compile ember templates
		ember_templates: {
			compile: {
				options: {
					templateName: function(sourceFile) {
						return sourceFile.replace(/(^.*\/)|(\.hbs$)/gi, '');
					}
				},
				files: {
					'public/js/templates.js': ['views/templates/*.hbs']
				}
			}
		}
	});

	// load plugin...
	grunt.loadNpmTasks('grunt-ember-templates');

	// define handlebars task
	grunt.registerTask('default', ['ember_templates']);

}