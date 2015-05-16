module.exports = function(grunt) {
  
  grunt.initConfig({
    jasmine : {
      test: {
        src: 'dist/Entities.js',
        options: {
          specs: 'spec/*Spec.js'
        }
      }
    },
    jshint : {
      all: {
        options : {
          esnext : true
        },
        src: [ 'src/core/*.js' ]
      }
    },
    clean: {
      dist: ['dist']
    },
    concat: {
      options: {
        separator: '\n\n\n',
      },
      GG: {
        src: [
          'src/Intro.js',
          'src/Entities.js',
          'src/Outro.js',
          'src/core/*.js'
        ],
        dest: 'dist/Entities.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-contrib-clean');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'clean', 'concat']);
};