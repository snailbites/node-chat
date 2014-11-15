// only sass for now
module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default',['watch']);
};