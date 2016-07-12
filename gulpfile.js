'use strict';

const gulp = require('gulp'),
			sass = require('gulp-sass');

var srcPath = '',
		destPath = '';

// SASS ________________________________________________________________________
srcPath = 'sass/*.scss';
destPath = 'css';

function compileSass(srcPath, destPath) {
	return gulp.src(srcPath)
		.pipe(sass.sync().on('error', sass.logError))
		.pipe(gulp.dest(destPath));
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
