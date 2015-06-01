module.exports = function(grunt) {
  
  grunt.initConfig({
    mochacov: {
      test: {
        options: {
          reporter: 'dot'
        }
      },
      options: {
        clearRequireCache: true,
        'check-leaks' : true,
        harmony : true,
        files: 'test/spec/*'
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
          'src/Polyfills.js',
          'src/Entities.js',
          'src/core/*.js',
          'src/Outro.js'
        ],
        dest: 'dist/Entities.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-cov');
  
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['jshint', 'clean', 'concat', 'mochacov:test']);
  
  grunt.registerTask('test', ['mochacov:test']);
};