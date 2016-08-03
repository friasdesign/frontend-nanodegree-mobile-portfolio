/* jshint esversion: 6 */
/* globals require */

(function GulpMain() {

'use strict';

const gulp = require('gulp'),
			sass = require('gulp-sass'),
			htmlmin = require('gulp-htmlmin'),
			uglify = require('gulp-uglify'),
			autoprefixer = require('gulp-autoprefixer'),
			cleanCSS = require('gulp-clean-css'),
			browserSync = require('browser-sync').create(),
			imagemin = require('gulp-imagemin'),
			pngquant = require('imagemin-pngquant'),
			rename = require('gulp-rename'),
			imageResize = require('gulp-image-resize'),
			webp = require('gulp-webp'),
			inject = require('gulp-inject');

// Demilitarized Object, it's a pattern used for passing a safe object as first
// argument for bind, apply or call methods, for preventing possible global
// pollution. More info: //github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch2.md#safer-this
const DMZ = Object.create(null);

// This constant saves the path to the post-built code. You can change this
// value to compile to another destination.
const distDir = 'dist';

var srcPath = '',
		destPath = '';

// SASS ________________________________________________________________________
srcPath = 'sass/*.scss';
destPath = 'css';

function compileSass(srcPath, destPath) {
	return gulp.src(srcPath)
		.pipe(sass.sync().on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(gulp.dest(destPath))
		.pipe(browserSync.stream());
}

gulp.task('compile-styles--base',
	compileSass.bind(DMZ,
		'./' + srcPath,
		'./' + destPath)
);

gulp.task('compile-styles--views',
	compileSass.bind(DMZ,
		'./views/' + srcPath,
		'./views/' + destPath)
);

gulp.task('compile-styles', [
	'compile-styles--base',
	'compile-styles--views'
]);

// SERVER ______________________________________________________________________
gulp.task('serve', ['compile-styles', 'inject-assets'],() => {
	browserSync.init({
		server: './'
	});

	gulp.watch('./sass/*.scss', ['compile-styles--base']);
	gulp.watch('./views/sass/*.scss', ['compile-styles--views']);
	gulp.watch('./*.html').on('change', browserSync.reload);
});

// INJECT ASSETS _______________________________________________________________
gulp.task('inject-assets--views', () => {
	return gulp.src('./views/templates/pizza.html')
		.pipe(inject(gulp.src(['./views/js/main.js']), {
			starttag: '<!-- inject:{{ext}} -->',
			transform: function (filePath, file) {
				var content = file.contents.toString('utf8');
				
				return `<script type="text/javascript">\n${content}\n</script>`
			}
		}))
		.pipe(inject(gulp.src(['./views/css/style.css']), {
			starttag: '<!-- inject:{{ext}} -->',
			transform: function (filePath, file) {
				var content = file.contents.toString('utf8');
				
				return `<style>\n${content}\n</style>`
			}
		}))
		.pipe(gulp.dest('./views'));
});

gulp.task('inject-assets', ['inject-assets--views'], () => {
	return gulp.src('./templates/*.html')
		.pipe(inject(gulp.src(['./css/style.css']), {
			starttag: '<!-- inject:{{ext}} -->',
			transform: function (filePath, file) {
				var content = file.contents.toString('utf8');
				
				return `<style>\n${content}\n</style>`
			}
		}))
		.pipe(gulp.dest('./'));
});


// MIN__HTML ___________________________________________________________________
function minifyHTML(srcPath, destPath) {
	return gulp.src(srcPath)
		.pipe(htmlmin({
			collapseWhitespace: true,
			minifyCSS: true,
			minifyJS: true,
			removeComments: true
		}))
		.pipe(gulp.dest(destPath));
}

gulp.task('minify-html--base',
	minifyHTML.bind(DMZ,
		'*.html',
		distDir + '/')
);

gulp.task('minify-html--views',
	minifyHTML.bind(DMZ,
		'views/*.html',
		distDir + '/views')
);

gulp.task('minify-html', [
	'minify-html--base',
	'minify-html--views'
]);

// MIN__CSS ____________________________________________________________________
function minifyCSS(srcPath, destPath) {
	return gulp.src(srcPath)
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(gulp.dest(destPath));
}

gulp.task('minify-css--base',
	minifyCSS.bind(DMZ,
		'css/*.css',
		distDir + '/css')
);

gulp.task('minify-css--views',
	minifyCSS.bind(DMZ,
		'views/css/*.css',
		distDir + '/views/css')
);

gulp.task('minify-css', [
	'compile-styles',
	'minify-css--base',
	'minify-css--views'
]);

// MIN__JS _____________________________________________________________________
function minifyJS(srcPath, destPath) {
	return gulp.src(srcPath)
		.pipe(uglify())
		.pipe(gulp.dest(destPath));
}

gulp.task('minify-js--base',
	minifyJS.bind(DMZ,
		'js/*.js',
		distDir + '/js')
);

gulp.task('minify-js--views',
	minifyJS.bind(DMZ,
		'./views/js/*.js',
		distDir + '/views/js')
);

gulp.task('minify-js', [
	'minify-js--base',
	'minify-js--views'
]);

// MIN__IMG ____________________________________________________________________

// This logic is only used once in pizzeria.jpg, although this task reusable in
// other more complex projects.
const breakPoints = [
	{
		type: 'mobile',
		size: 720
	},
	{
		type: 'desktop',
		size: 360
	}
];
var resizeImageTasks = [];

function baseConversion(src, dest, size, dpi,format) {
  format = format || "";
  dpi = dpi || 1;

  const baseDir = 'views/images/';
  var imgResizeOpt = { width: size * dpi },
      suffix = "";

  if(format) {
    imgResizeOpt.format = format; 
  }

  if (dpi > 1) {
    suffix = "-" + dpi + "x";
  }

  return gulp.src(baseDir + src)
    .pipe(imageResize(imgResizeOpt))
    .pipe(imagemin({ progressive: true }))
    .pipe(rename((path) => { path.basename += suffix; }))
    .pipe(gulp.dest(baseDir + dest));
}

breakPoints.forEach(function imageResizer(breakpoint){
	let taskName = '',
			size = breakpoint.size,
			// These paths are relatives to images folder, in this case views/images
			srcPath = '.__raw/*.{jpeg,jpg,png}',
			destPath = size;

	// If the target breakpoint is desktop type, create a task to generate an x1
	// version of the image
	if(breakpoint.type === 'desktop') {
		// ORIGINAL FORMAT --> x1 Pixel ratio task
	  taskName = 'resize_' + size;

	  gulp.task(taskName, () => {
	    baseConversion(srcPath, destPath, size, 1);
	  });
	  resizeImageTasks.push(taskName);

	  // WEBP FORMAT --> x1 Pixel ratio task
	  taskName = 'resize_webp_' + size;
	  gulp.task(taskName, () => {
	    baseConversion(srcPath, destPath, size, 1, 'webp');
	  });
	  resizeImageTasks.push(taskName);
	}

 	// ORIGINAL FORMAT --> x2 Pixel ratio task
  taskName = 'resize_' + size + '_x2';
  gulp.task(taskName, () => {
    baseConversion(srcPath, destPath, size, 2);
  });
  resizeImageTasks.push(taskName);

  // WEBP FORMAT --> x2 Pixel ratio task
  taskName = 'resize_webp_' + size + '_x2';
  gulp.task(taskName, () => {
    baseConversion(srcPath, destPath, size, 2, 'webp');
  });
  resizeImageTasks.push(taskName);

  // If the target breakpoint is mobile type, create a task to generate an x3
  // version off the image
  if(breakpoint.type === 'mobile') {
  	// ORIGINAL FORMAT --> x2 Pixel ratio task
	  taskName = 'resize_' + size + '_x3';
	  gulp.task(taskName, () => {
	    baseConversion(srcPath, destPath, size, 3);
	  });
	  resizeImageTasks.push(taskName);

	  // WEBP FORMAT --> x2 Pixel ratio task
	  taskName = 'resize_webp_' + size + '_x3';
	  gulp.task(taskName, () => {
	    baseConversion(srcPath, destPath, size, 3, 'webp');
	  });
	  resizeImageTasks.push(taskName);
  }

});

function minIMG(srcPath, destPath) {
	return gulp.src(srcPath)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(destPath));
}

gulp.task('responsive-img', resizeImageTasks);

gulp.task('min-img--base', minIMG.bind(DMZ,
	'img/*',
	distDir + '/img')
);

gulp.task('min-img--views', minIMG.bind(DMZ,
	'views/images/*/*',
	distDir + '/views/images')
);

gulp.task('min-img', [
	'responsive-img',
	'min-img--base',
	'min-img--views'
]);

// BUILD _______________________________________________________________________
gulp.task('build', [
	'inject-assets',
	'minify-css',
	'minify-js',
	'minify-html',
	'min-img'
]);

})();
