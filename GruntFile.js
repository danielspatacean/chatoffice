module.exports = function (grunt) {
    grunt.initConfig({
        uglify: {
            my_target: {
                files: {
                    './public/js/min.js': ['./public/scripts/*.js']
                }
            },
            options: {
                mangle: false
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['uglify']);
}