'use strict';

/* eslint-disable prefer-arrow-callback */
/* TODO: Use arrow-functions for tasks once gulp-param fixes bug that causes them not to work */

// Manually up listeners max.
// Notice max limit is not disabled. We want to know if the number
// of listeners surpasses a reasonable amount. Also note that this
// does not affect debug threads. This is only for gulp processes.
require('events').EventEmitter.prototype._maxListeners = 50;

const gulp = require('gulp-help')(require('gulp-param')(require('gulp'), process.argv));
const async = require('async');
const del = require('del');
const DependencyResolver = require('dependency-resolver');
const merge = require('merge2');
const path = require('path');

// load gulp plugins
const G$ = require('gulp-load-plugins')({ lazy: true });
const chalk = G$.util.colors;
const debug = G$.util.log;

// constants
const PROJECT_VAR = '{project}';
let APP_NAME = process.env.APP_NAME;

// load settings
const settings = require('./gulp.json');
const tsconfig = require('./tsconfig.master.json');
let projects = require('./projects.json');
// projects = filterProjects(projects);
const projectNames = Object.keys(projects);

// function filterProjects(projects) {
//     const refinedProjects = {};
//     Object.keys(projects).forEach(p => { if (!projects[p].excludeInMainBuild) refinedProjects[p] = projects[p] });
//     return refinedProjects;
// }

function distinct(list) {
    if (!Array.isArray(list))
        throw Error('Cannot distinct a list that is not an array');
    return Array.from(new Set(list));
}

function escapeAt(project) {
    return project[0] === '@' ? `/${project}` : project;
}

function expandPaths(globArray, projects) {
    projects = projects ? Array.isArray(projects) ? projects : [projects] : projectNames;
    const expandedGlob = [];
    globArray.forEach(item => {
        if (item.indexOf(PROJECT_VAR) > 0) {
            projects.forEach(project => {
                expandedGlob.push(item.replace(PROJECT_VAR, escapeAt(project)));
            });
        } else {
            expandedGlob.push(item);
        }
    });
    return expandedGlob;
}

function wildcharPaths(globArray) {
    const expandedGlob = [];
    globArray.forEach(item => {
        if (item.indexOf(PROJECT_VAR) > 0) {
            expandedGlob.push(item.replace(PROJECT_VAR, '*'));
        } else {
            expandedGlob.push(item);
        }
    });
    return expandedGlob;
}

function mapPaths(globArray, project, escapePaths) {
    return globArray.map(path => mapPath(path, escapePaths ? escapeAt(project) : project));
}

function mapPath(path, project, escapePaths) {
    return path.replace(PROJECT_VAR, escapePaths ? escapeAt(project) : project);
}

const exec = require('child_process').exec;
function runCommand(command, options, callback) {
    exec(command, options, function (error, stdout, stderr) {
        console.log(`${path.resolve(options.cwd || '.')} ${command}`);
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log('exec error: ', error);
        }
        // callback(error == null);
        callback();
    });
}

let resolver;

function getDependencyList(project) {
    if (resolver === undefined) {
        resolver = new DependencyResolver();
        projectNames.forEach(name => resolver.add(name));
        projectNames.forEach(projectName => {
            (projects[projectName].dependencies || []).forEach(dep => {
                resolver.setDependency(project, dep);
            });
        });
    }
    return resolver.resolve(project);
}

/**
 * {cmd: "", cwd: ""}
 */
function runCommands(commands, callback) {
    async.eachSeries(commands, function (command, done) {
        runCommand(command.cmd, { cwd: command.cwd }, done);
    }, function () {
        callback();
    });
}

const packTaskOpts = {
    options: {
        pack: 'Package name',
        project: `Project name: ${chalk.green(projectNames.join(chalk.white(', ')))}`
    }
};
const projTaskOpts = {
    options: {
        project: `Project name: ${chalk.green(projectNames.join(chalk.white(', ')))}`
    }
};

// DO NOT CHANGE DEFAULT TASK - Azure depends on it
gulp.task('default', false, defaultTask);

gulp.task('debug', 'Run the project and auto-restart for changes', debugTask, projTaskOpts);
gulp.task('deploy-simulate', 'Simulate a deployment', deploySimulateTask, projTaskOpts);
gulp.task('init-main', false, initMainTask);
gulp.task('startup', false, startupTask);

function debugTask(project, debugScope) {
    debugScope = debugScope || 'mark:*';
    if (project === undefined)
        return console.log('You must specify a project');
    console.log(`debugging projects/${project} with DEBUG=${debugScope}`);
    G$.nodemon({
        script: `${project}.js`,
        ext: 'js',
        env: {
            NODE_ENV: 'development',
            DEBUG: debugScope
        },
        delay: 1, // Sec
        watch: `projects/${escapeAt(project)}`,
        ignore: `projects/${escapeAt(project)}/src`
    });
}

function defaultTask(callback) {
    if (APP_NAME)
        G$.sequence('startup', callback);
    else // not running in azure
        G$.sequence('help', callback);
}

function deploySimulateTask(project, callback) {
    APP_NAME = project;
    if (!project) {
        console.log('You must specify a project with --project');
        callback();
        return;
    }
    G$.sequence('startup', callback);
    // to test one at a time:
    // G$.sequence('clean-main', callback);
    // G$.sequence('install-main', callback);
    // G$.sequence('init-main', callback);
    // G$.sequence('build-main', callback);
}

function initMainTask() {
    // setup start file (copy correct file to index.js)
    return gulp.src(`${escapeAt(APP_NAME)}.js`)
        .pipe(G$.rename('index.js'))
        .pipe(gulp.dest('.'));
}

function startupTask(callback) {
    G$.sequence('clean-main', ['install-main', 'init-main'], 'build-main', callback);
}

// Setup tasks
gulp.task('setup', 'Install all modules and link projects', setupTask);
gulp.task('teardown', 'Clean all and unlink projects', teardownTask);

function setupTask(callback) {
    G$.sequence('install', 'link', callback);
}

function teardownTask(callback) {
    G$.sequence('unlink', 'deepclean', callback);
}

// NPM install tasks
gulp.task('install', 'Install all npm modules', installTask);
gulp.task('install-main', false, installMainTask);

function installTask(callback) {
    const commands = [];
    // commands.push({cmd:'npm install', cwd: undefined});
    projectNames.forEach(name => {
        commands.push({ cmd: 'npm install', cwd: `projects/${name}` });
    });
    runCommands(commands, callback);
}

function installMainTask(callback) {
    const deps = getDependencyList(APP_NAME);
    deps.push(APP_NAME);
    const commands = [];
    // commands.push({cmd:'npm install', cwd: undefined});
    deps.forEach(name => {
        // npm install
        commands.push({ cmd: 'npm install', cwd: `projects/${name}` });
    });
    runCommands(commands, callback);
}

// NPM link tasks
gulp.task('link', 'Link dependencies on local disk', linkTask);
gulp.task('unlink', 'Unlink dependencies on local disk', unlinkTask);

function linkTask(callback) {
    linker(true, callback);
}

function unlinkTask(callback) {
    linker(false, callback);
}

function linker(mode, callback) {
    const linkedDeps = {};
    const commands = [];
    projectNames.forEach(proj => {
        if (projects[proj].dependencies) {
            projects[proj].dependencies.forEach(dep => {
                if (!linkedDeps[dep]) {
                    commands.push({ cmd: `npm ${mode ? 'link' : 'unlink'} --no-bin-links`, cwd: `projects/${dep}` });
                    linkedDeps[dep] = true;
                }
                if (mode) {
                    const packageName = require(`./projects/${dep}/package.json`).name;
                    commands.push({ cmd: `npm ${mode ? 'link' : 'unlink'} ${packageName} --no-bin-links`, cwd: `projects/${proj}` });
                }
            });
        }
    });
    runCommands(commands, callback);
    // INFO about "--no-bin-links" : see http://stackoverflow.com/questions/17990647/npm-install-errors-with-error-enoent-chmod
}

// Linting tasks
gulp.task('tslint', 'Lints all TypeScript source files', tsLintTask);

// Generate project lint tasks
const tsLintTasks = {};
projectNames.forEach(name => {
    tsLintTasks[name] = function () {
        return gulp.src(expandPaths(settings.tsfiles, [name]))
            .pipe(G$.tslint({ formatter: 'verbose' }))
            .pipe(G$.tslint.report({ emitError: false }));
    };
    gulp.task(`tslint-${name}`, `Lints all ${chalk.green(name)} TypeScript source files `, tsLintTasks[name]);
});

function tsLintTask() {
    return gulp.src(expandPaths(settings.tsfiles))
        .pipe(G$.tslint({
            formatter: 'verbose'
        }))
        .pipe(G$.tslint.report({
            emitError: false
        }));
}

// Building tasks
gulp.task('build', 'Compiles all TypeScript source files and updates module references', buildTask);
gulp.task('build-main', false, buildMainTask);
gulp.task('watch', 'Contiuous build', watchTask);

// Generate project build tasks
const buildTasks = {};
projectNames.forEach(name => {
    buildTasks[name] = function (callback) {
        G$.sequence([`tslint-${name}`], `ts-${name}`, callback);
    };
    gulp.task(`build-${name}`, `Compiles all ${chalk.green(name)} TypeScript source files and updates module references`, ['clean'], buildTasks[name]);
});

function buildTask(callback) {
    G$.sequence(['tslint', 'clean'], 'ts-all', callback);
}

function buildMainTask(callback) {
    let sequence = getDependencyList(APP_NAME);
    sequence.push(APP_NAME);
    sequence = sequence.map(item => `ts-${item}`);
    G$.sequence(sequence, callback);
}

function watchTask(project) {
    const startTime = new Date();
    if (project === undefined)
        project = 'all';

    // Determine scope of watch
    const targets = project === '*' || project === 'all' ?
        projectNames.filter(name => {
            return !projects[name].excludeInMainBuild;
        }) :
        distinct([project].concat(getDependencyList(project)));

    // Execute build tasks
    const tasks = targets.map(target => `build-${target}`);
    G$.sequence(tasks, function () {
        // Setup watch on each project
        targets.forEach(name =>
            gulp.watch(mapPaths(settings.watchFiles, name, true), [`tslint-${name}`, `ts-${name}`]));

        debug(`**ready after ${Math.round((new Date() / 1000) - (startTime / 1000))} seconds**`);
    });
}

// Cleaning tasks
gulp.task('clean', 'Cleans the generated files from lib directory', cleanTask);
gulp.task('clean-main', false, cleanMainTask);
gulp.task('deepclean', 'Cleans the generated files from lib directory and all node_modules', deepCleanTask);
gulp.task('test-clean', 'Cleans the generated files from lib directory', testCleanTask);

function cleanTask() {
    return del(expandPaths(settings.clean), { dot: true });
}

function cleanMainTask() {
    return del(expandPaths(settings.cleanMain), { dot: true });
}

function deepCleanTask() {
    return del(expandPaths(settings.deepClean), { dot: true });
}

function testCleanTask() {
    return del(expandPaths(settings.testClean));
}

// Typescript compilation tasks
gulp.task('ts-all', 'Transpile all projects', tsAllTask);

// Generate project ts tasks
const tsTasks = {};
projectNames.forEach(name => {
    tsTasks[name] = function () {
        const inProduction = APP_NAME !== undefined;
        if (inProduction) {
            // compiling in production
            tsconfig.compilerOptions.isolatedModules = true;
        }
        const tsResult = gulp.src(mapPaths(settings.tsfiles, name))
            .pipe(G$.sourcemaps.init({ identityMap: true }))
            .pipe(G$.typescript.createProject(tsconfig.compilerOptions)());
        // console.log('sourcemaps',G$.sourcemaps.mapSources(mapPaths(settings.tsfiles, name)));
        const dest = mapPath(settings.dest, name);
        if (inProduction) {
            return merge([
                // .js files, no sourcemaps, no .d.ts files
                tsResult.js.pipe(gulp.dest(dest)),
                // all other files
                gulp.src(mapPaths(settings.resources, name)).pipe(gulp.dest(dest))
            ]);
        }
        return merge([
            // .d.ts files
            tsResult.dts.pipe(gulp.dest(dest)),
            // .js files + sourcemaps
            settings.inlineSourcemaps ?
                tsResult.js
                    .pipe(G$.sourcemaps.write({
                        includeContent: false,
                        sourceRoot: '../src'
                    })) // separate .js.map files) // inline sourcemaps
                    .pipe(gulp.dest(dest)) :
                tsResult.js
                    .pipe(G$.sourcemaps.write('.', {
                        includeContent: false,
                        sourceRoot: '../src'
                    })) // separate .js.map files
                    .pipe(gulp.dest(dest)),
            // all other files
            gulp.src(mapPaths(settings.resources, name)).pipe(gulp.dest(dest))
        ]);
    };
    gulp.task(`ts-${name}`, `Transpile ${chalk.green(name)}`, tsTasks[name]);
});

function tsAllTask(callback) {
    G$.sequence(projectNames.filter(name => {
        return (!projects[name].excludeInMainBuild) || (name == APP_NAME);
    }).map(name => `ts-${name}`), callback);
}

// Testing tasks
gulp.task('test', 'Runs all tests', ['test-clean', 'test-build'], testTask);
gulp.task('test-build', 'Transpile all test files', testBuildTask);

const tsTestTasks = {};
// Generate test project ts tasks
projectNames.forEach(name => {
    tsTestTasks[name] = function () {
        const tsResult = gulp.src(mapPaths(settings.testFiles, name))
            .pipe(G$.sourcemaps.init())
            .pipe(G$.typescript.createProject(tsconfig.compilerOptions)());
        const dest = mapPath(settings.testDest, name);
        return merge([
            // .d.ts files
            tsResult.dts.pipe(gulp.dest(dest)),
            // .js files + sourcemaps
            settings.inlineSourcemaps ?
                tsResult.js
                    .pipe(G$.sourcemaps.write()) // inline sourcemaps
                    .pipe(gulp.dest(dest)) :
                tsResult.js
                    .pipe(G$.sourcemaps.write('.', {
                        sourceRoot: function (file) { return file.cwd + '/src'; }
                    })) // separate .js.map files
                    .pipe(gulp.dest(dest)),
            // all other files
            gulp.src(mapPaths(settings.testResources, name)).pipe(gulp.dest(dest))
        ]);
    };
    gulp.task(`test-ts-${name}`, false, tsTasks[name]);
});

function testTask() {
    G$.util.log(chalk.cyan(`Testing ${wildcharPaths(settings.testFiles)}`));

    return gulp
        .src(wildcharPaths(settings.testFiles), { read: true })
        .pipe(G$.plumber()) // exit gracefully if something fails after this
        .pipe(G$.mocha({ reporter: 'spec' }));
}

function testBuildTask(callback) {
    G$.sequence(projectNames.map(name => `test-ts-${name}`), callback);
}

// Version bump

const bumpOpts = {
    options: {
        major: `when you make incompatible API changes`,
        minor: `when you add functionality in a backwards-compatible manner`,
        patch: `when you make backwards-compatible bug fixes`,
        project: `Project name: ${chalk.green(projectNames.join(chalk.white(', ')))}`
    }
};

gulp.task('bump', 'Version bump a project.', function (major, minor, patch, project) {
    if (!project) return console.log(`${chalk.red('No project specified!')}`);
    let type = '';
    if (major && !minor && !patch) type = 'major';
    if (!major && minor && !patch) type = 'minor';
    if (!major && !minor && patch) type = 'patch';
    if (!type) return console.log(`${chalk.red('Specify one version type to bump!')}`);
    const cwd = 'projects/project/';
    return gulp.src('./package.json', { cwd })
        .pipe(G$.bump({ type }))
        .pipe(gulp.dest('./', { cwd }));
}, bumpOpts);

// Extra tasks

gulp.task('npm-i', `Install and save a ${chalk.cyan('pack')}age to a ${chalk.cyan('project')}`, npmInstallTask, packTaskOpts);
gulp.task('npm-u', `Uninstall and save a ${chalk.cyan('pack')}age to a ${chalk.cyan('project')}`, npmUninstallTask, packTaskOpts);
gulp.task('stats', 'Get lines of code', statsTask, projTaskOpts);

function npmInstallTask(project, pack, callback) {
    runCommand(`npm install --save ${pack}`, { cwd: mapPath(settings.projectPath, project) }, function () {
        callback();
    });
}

function npmUninstallTask(project, pack, callback) {
    runCommand(`npm uninstall --save ${pack}`, { cwd: mapPath(settings.projectPath, project) }, function () {
        callback();
    });
}

function statsTask(project) {
    if (project) console.log(project);
    if (project) {
        console.log(`Source Lines of Code: ${chalk.green(project)}`);
        gulp.src(mapPaths(settings.sloc_project, project)).pipe(G$.sloc({ tolerant: true }));
    } else {
        console.log(`Source Lines of Code: ${chalk.white('ALL')}`);
        gulp.src(settings.sloc_all).pipe(G$.sloc({ tolerant: true }));
    }
}

// Attitional reference: https://github.com/johnpapa/gulp-patterns
// http://www.bennadel.com/blog/2169-where-does-node-js-and-require-look-for-modules.htm
// http://thenodeway.io/posts/how-require-actually-works/
// https://glebbahmutov.com/blog/hooking-into-node-loader-for-fun-and-profit/
// on NODE_PATH: https://gist.github.com/branneman/8048520
/**
 * Other considered solutions to the require problem
 * https://www.npmjs.com/package/require-hacker
 * https://www.npmjs.com/package/require-as
 * https://www.npmjs.com/package/extended-require
 * https://github.com/alex20465/require-mod
 *
 */