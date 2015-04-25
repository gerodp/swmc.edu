/*global -$ */
'use strict';
// generated on 2015-02-22 using generator-gulp-webapp 0.3.0
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var fileinclude = function fileinclude() {
    return gulp.src(['app/*.html','app/views/**/*.html'])
        .pipe($.fileInclude())
        .pipe(gulp.dest('.tmp/fileinclude/'))
        .pipe($.size());
};

gulp.task('fileinclude', fileinclude);

gulp.task('sprite', function () {
  var spriteData = gulp.src('app/images/sprites/*.png').pipe($.spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.scss',
    imgPath: '../images/sprite.png',
    cssFormat: 'css'
  }));
  // Pipe image stream through image optimizer and onto disk
  spriteData.img
    .pipe($.imagemin())
    .pipe(gulp.dest('app/images/'));

  // Pipe CSS stream through CSS optimizer and onto disk
  spriteData.css
    .pipe($.csso())
    .pipe(gulp.dest('app/styles/core/'));
});

gulp.task('styles', function () {
  return gulp.src('app/styles/main.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'nested', // libsass doesn't support expanded yet
      precision: 10,
      includePaths: ['.'],
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe($.postcss([
      require('autoprefixer-core')({browsers: ['last 1 version']})
    ]))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('jshint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    //.pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

gulp.task('html', ['styles','fileinclude'], function () {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('.tmp/fileinclude/**/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src(['app/images/**/*', '!app/images/sprites/*'])
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['styles', 'fonts', 'fileinclude'], function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp','app','.tmp/fileinclude'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'app/**/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);

  gulp.watch('app/{templates/**/,}*.html', ['fileinclude']);
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/**/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass-official'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('zip', function() {
  var dt = (function() {
    var m = this.getMonth() + 1;
    var d = this.getDate();
    m = m < 10 ? '0' + m : '' + m;
    d = d < 10 ? '0' + d : '' + d;
    return '' + this.getFullYear() + m + d;
  }).call(new Date);
  var pjson = require('./package.json');
  return gulp.src('dist/' + '**/*')
    .pipe($.zip(pjson.name +'-v'+pjson.version +'-'+ dt + '.zip'))
    .pipe(gulp.dest('zip/'));
});


gulp.task('build', ['jshint', 'html','sprite', 'images', 'fonts', 'extras'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
