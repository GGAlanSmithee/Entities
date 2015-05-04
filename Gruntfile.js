module.exports = function(grunt) {
  
  grunt.initConfig({
    clean: {
      dist: ['dist']
    },
    concat: {
      options: {
        separator: '\n\n\n',
      },
      GG: {
        src: [
          'lib/*.js',
          'src/Intro.js',
          'src/Entities.js',
          'src/Outro.js',
          'src/core/*.js'
        ],
        dest: 'dist/Entities.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'concat']);

};