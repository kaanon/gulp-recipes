/**
 * Gulpfile for task running
 * @author Kaanon MacFarlane <@thekaanon>
*/

var jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    minify = require('gulp-minify-css'),
    util = require('gulp-util'),
    filesize = require('gulp-filesize'),
    rename = require('gulp-rename'),
    usemin = require('gulp-usemin'),
    exclude = require('gulp-ignore').exclude,
    nodemon = require('gulp-nodemon'),
    handlebars = require('gulp-compile-handlebars'),
    open = require('open'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul'),
    git = require('gulp-git'),
    argv = require('yargs').argv,
    gulp = require('gulp'),
    fs = require('fs'),
    connect = require('gulp-connect'),
    open = require('open');
    _ = require('underscore'),;


module.exports = function(gulp, opts){

    var moduleScripts = opts.moduleScripts || ['./lib/**/*.js','./public/**/*.js','./models/*.js','./collections/*.js','./routes/*.js','./views/*.js','*.js'],
        publicScripts = opts.publicScripts || ['./public/**/*.js'],
        testScripts   = opts.testScripts || './test/**/*.js',
        localPath     = opts.localPath || './',
        localPort     = opts.localPort || 9001,
        browserApp    = opts.browser || "Google Chrome";
        
    //Run jshint over client and server side code
    gulp.task('lint', function(){
        var scripts = moduleScripts + './package.json';
        return gulp.src(scripts)
            .pipe(exclude(/(libs|min|compiled|all)/i))
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'));
    });

    //Run jshint over client side code
    gulp.task('lint-public',function(){
       return gulp.src(publicScripts)
            .pipe(exclude(/(libs|min|compiled|all)/i))
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'));
    })

    /**
     * Run Mocha test and Istanbul Code Coverage
     * @method
     * @param  {Function} done [description]
     * @return {[type]}
     */
    gulp.task('test', function (done) {
      process.env.NODE_APP_DIR = process.cwd();
      gulp.src(moduleScripts)
        .pipe(exclude(/.json$/))
        .pipe(istanbul()) // Covering files
        .on('end', function () {
          gulp.src(testScripts)
            .pipe(mocha({
                reporter: 'spec',
                timeout: 2000,
            }))
            .pipe(istanbul.writeReports()) // Creating the reports after tests runned
            .on('error',function(err){
                    util.log(err.message);
                    process.exit(1);
                })
            .on('end', done);
        });
    });

    /**
     * Keeps your nodejs app running and restarts upon
     * changing js or handlebars files
     */
    gulp.task('develop', function () {
        nodemon({ 
            script: 'app.js', 
            ext:    'handlebars js', 
            watch:  ['lib','routes','middleware','models','views'], 
            ignore: ['node_modules','public'] })
        .on('restart', function () {
            console.log('app.js restarted!' + "\n\n");
        });
    });

    /**
     * Prebuild tasks
     * - Make sure arguments, filename exist
     * - JSHint on on js files 
     * @method
     * @return {[type]}
     */
    gulp.task('lint-html',  function(){
        var filename = argv.filename || false;,
            filepath = /\.html$/.test(filename) ? './' + filename : './' + filename+'.html'; 

        if(!filename){
            util.log('Must pass in --filename');
            return util.noop();
        }
        if(!fs.existsSync(filepath)){
            util.log('Filename: '+ filepath + ' does not exist.');
            return util.noop();
        }

        var content = require('fs').readFileSync(filepath, { encoding: 'utf8'});
        var regex = /<\s*script\s+.*?src\s*=\s*"([^"]+?)".*?><\s*\/\s*script\s*>/gim;
        var result, scripts = [];
        while ( (result = regex.exec(content)) ) {
            //Dont look at any lib files or min files, they are meant to be crazy
            if(!result[1].match(/lib|min/)){ 
                scripts.push(result[1].replace('..','.'));
            }
        }
        
        return gulp.src(scripts)
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'));

    });
    

    //Serve the dev folder
    gulp.task('serve-static', function(){
        connect.server({
            root: [localPath],
            port: localPort,
            livereload: true,
        })
    });

    gulp.task('openBrowser',function(){
    var open = require('open');
        open('http://localhost:' + localPort, browserProgram);
    });

    //Reload the browser when files are changed
    gulp.task('serve-reload', function () {
      return gulp.src(localPath + '*.html')
        .pipe(connect.reload());
    });

    //Watch the html, js, css files
    gulp.task('serve-watch', function () {
      gulp.watch([localPath+'*.html', './js/*', './js/**/*', './css/**/*','./css/*',], ['serve-reload']);
    });

    //Serve the local-dev folder, watch for changes, open browser
    gulp.task('serve', ['serve-dev', 'serve-watch', 'openBrowser']);

    //The default task is to serve the pages
    gulp.task('default', ['serve']);


  return gulp;
};



