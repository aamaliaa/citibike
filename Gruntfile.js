module.exports = function(grunt){

	'use strict';

	grunt.initConfig({
		jshint: {
			files: [
				'app.js',
				'public/js/main.js',
				'em.app.js'
			],
			options: {
				globals: {
					jQuery: true
				},
			}
		},
		watch: {
			files: ['views/templates/*.hbs', '<%= jshint.files %>'],
			tasks: ['jshint', 'ember_templates']
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
	grunt.loadNpmTasks('grunt-contrib-jshint');

	// define handlebars task
	grunt.registerTask('default', ['jshint', 'ember_templates']);

}