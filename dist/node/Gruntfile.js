'use strict';

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			dist: {
				watch: true,
				keepAlive: true,
				files: {
					'dist/browser/jsexpr.js': ['jsexpr.js']
				}
			}
		},
		babel: {
			options: {
				sourceMap: true,
				presets: ['es2015']
			},
			dist: {
				files: [{
					expand: true,
					src: ['*.js', 'lib/*.js'],
					dest: 'dist/node',
					ext: '.js'
				}, {
					'dist/browser/jsexpr.js': ['dist/browser/jsexpr.js']
				}]
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			dist: {
				files: {
					'dist/browser/jsexpr.min.js': ['dist/browser/jsexpr.js']
				}
			}
		},
		clean: ['dist/browser/*.js', 'dist/browser/*.map']
	});

	grunt.registerTask('default', ['browserify', 'babel', 'uglify']);
};
//# sourceMappingURL=Gruntfile.js.map
