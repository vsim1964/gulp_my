const gulp = require("gulp");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const sass = require("gulp-sass")(require("sass"));
const csso = require("gulp-csso");
const rename = require("gulp-rename");
const pug = require("gulp-pug");
const htmlmin = require("gulp-htmlmin");
const terser = require("gulp-terser");
const del = require("del");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgSprite = require('gulp-svg-sprite');
const sync = require("browser-sync").create();

const rastr = () => {
	return gulp.src('dev/img/rastr/**/*.*')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{
				removeViewBox: false
			}],
			interlaced: true,
			optimizationLevel: 3 // 0 to 7
		}))
		.pipe(gulp.dest('dist/img/'))
		.pipe(webp({
			quality: 75
		}))
		.pipe(
			rename({
				extname: ".webp"
			})
		)
		.pipe(gulp.dest('dist/img/'))
}
exports.rastr = rastr;

const sprite = () => {
	return gulp.src('dev/img/svg/*.svg')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{
				removeViewBox: false
			}],
		}))
		.pipe(gulp.dest('dist/img/svg/'))
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: "../svg/sprite.svg", //sprite file name
					example: true
				}
			},
		}))
		.pipe(gulp.dest('dist/img/'))
}
exports.sprite = sprite;

// pug
const pugbem = () => {
	return gulp.src('dev/pug/*.pug')
		.pipe(plumber({
			errorHandler: notify.onError(function (err) {
				return {
					title: 'Pug',
					sound: false,
					message: err.message
				}
			})
		}))
		.pipe(pug({
			pretty: true
		}))
		.pipe(gulp.dest('dev/html'))
		.pipe(gulp.src('dev/html/*.html'))
		.pipe(htmlmin({
			collapseWhitespace: true
		}))
		.pipe(gulp.dest('dist/'))
}
exports.pugbem = pugbem;

// styles
const styles = () => {
	return gulp.src("dev/scss/style.scss")
		.pipe(plumber({
			errorHandler: notify.onError(function (err) {
				return {
					title: 'Styles',
					sound: false,
					message: err.message
				}
			})
		}))
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(gulp.dest("dist/css"))
		.pipe(csso())
		.pipe(rename({
			extname: ".min.css"
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest("dist/css"))
		.pipe(sync.stream());
}
exports.styles = styles;

// Scripts
const scripts = () => {
	return gulp.src("dev/js/**/*.js")
		.pipe(terser())
		.pipe(rename({
			extname: ".min.js"
		}))
		.pipe(gulp.dest("dist/js"))
		.pipe(sync.stream());
}
exports.scripts = scripts;

// Copy
const copyfont = (done) => {
	gulp.src("dev/fonts/*.*")
		.pipe(gulp.dest("dist/fonts/"))
	done();
}
exports.copyfont = copyfont;

// server
const server = (done) => {
	sync.init({
		server: {
			baseDir: "dist/"
		},
		cors: true,
		notify: false,
		ui: false,
	});
	done();
}
exports.server = server;

// Reload
const reload = (done) => {
	sync.reload();
	done();
}

// Очистка
const clean = () => {
	return del("dist/*.html", "dist/css");
}
exports.clean = clean;

const cleanimg = () => {
	return del("dist/img");
}
exports.cleanimg = cleanimg;

// Watcher
const watcher = () => {
	gulp.watch("dev/scss/**/*.scss", gulp.series(styles));
	gulp.watch("dev/js/*.js", gulp.series(scripts, reload));
	gulp.watch("dev/pug/**/*.pug", gulp.series(pugbem, reload));
}

// единая обработка изображений
const img = async () => gulp.series(
	cleanimg,
	rastr,
	sprite
);
exports.img = img;

// gulp
exports.default = gulp.series(
	clean,
	gulp.parallel(
		styles,
		scripts,
		pugbem
	),
	gulp.series(
		server,
		watcher
	));
