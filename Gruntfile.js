module.exports = function(grunt) {
  
  grunt.initConfig({
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
          'src/Utils.js',
          'src/core/*.js',
          'src/Outro.js'
        ],
        dest: 'dist/Entities.js'
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['jshint', 'clean', 'concat']);
};