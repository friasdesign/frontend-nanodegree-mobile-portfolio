'use strict';

const gulp = require('gulp'),
			sass = require('gulp-sass'),
			htmlmin = require('gulp-htmlmin'),
			uglify = require('gulp-uglify'),
			autoprefixer = require('gulp-autoprefixer'),
			cleanCSS = require('gulp-clean-css'),
			browserSync = require('browser-sync').create(),
			imagemin = require('gulp-imagemin'),
			pngquant = require('imagemin-pngquant');

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
	compileSass.bind(this,
		'./' + srcPath,
		'./' + destPath)
);

gulp.task('compile-styles--views',
	compileSass.bind(this,
		'./views/' + srcPath,
		'./views/' + destPath)
);

gulp.task('compile-styles', [
	'compile-styles--base',
	'compile-styles--views'
]);

// SERVER ______________________________________________________________________
gulp.task('serve', ['compile-styles'],() => {
	browserSync.init({
		server: './'
	});

	gulp.watch('./sass/*.scss', ['compile-styles--base']);
	gulp.watch('./views/sass/*.scss', ['compile-styles--views']);
	gulp.watch('./*.html').on('change', browserSync.reload);
});

// MIN__HTML ___________________________________________________________________
function minifyHTML(srcPath, destPath) {
	return gulp.src(srcPath)
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest(destPath));
}

gulp.task('minify-html--base',
	minifyHTML.bind(this,
		'*.html',
		distDir + '/')
);

gulp.task('minify-html--views',
	minifyHTML.bind(this,
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
	minifyCSS.bind(this,
		'css/*.css',
		distDir + '/css')
);

gulp.task('minify-css--views',
	minifyCSS.bind(this,
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
	minifyJS.bind(this,
		'js/*.js',
		distDir + '/js')
);

gulp.task('minify-js--views',
	minifyJS.bind(this,
		'./views/js/*.js',
		distDir + '/views/js')
);

gulp.task('minify-js', [
	'minify-js--base',
	'minify-js--views'
]);

// MIN__IMG ____________________________________________________________________
function minIMG(srcPath, destPath) {
	return gulp.src(srcPath)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(destPath));
}
gulp.task('min-img--base', minIMG.bind(this,
	'img/*',
	distDir + '/img')
);

gulp.task('min-img--views', minIMG.bind(this,
	'views/images/*',
	distDir + '/views/images')
);

gulp.task('min-img', [
	'min-img--base',
	'min-img--views'
]);

// BUILD _______________________________________________________________________
gulp.task('build', [
	'minify-js',
	'minify-html',
	'minify-css',
	'min-img'
]);
