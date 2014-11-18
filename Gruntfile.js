module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify : {
      build : {
        src : ['client/**/*.js'],
        dest : 'public/js/client.js' 
      }
    },
    sass: {
      dist: {
        options: {
          style: 'expanded',
          compass: true
        },
        files: {
          'public/css/stylesheets/ie.css' : 'public/css/sass/ie.scss',
          'public/css/stylesheets/print.css' : 'public/css/sass/print.scss',
          'public/css/stylesheets/screen.css' : 'public/css/sass/screen.scss',
        }
      }
    },
    watch: {
      css: {
        files: '**/*.scss',
        tasks: ['sass']
      },
      js : {
        files: 'client/**/*.js',
        tasks : ['browserify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['sass', 'browserify'])
};
