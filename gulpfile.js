'use strict';

/* eslint-disable prefer-arrow-callback */
/* TODO: Use arrow-functions for tasks once gulp-param fixes bug that causes them not to work */

// Manually up listeners max.
// Notice max limit is not disabled. We want to know if the number
// of listeners surpasses a reasonable amount. Also note that this
// does not affect debug threads. This is only for gulp processes.
require('events').EventEmitter.prototype._maxListeners = 50;

const gulp = require('gulp-help')(require('gulp-param')(require('gulp'), process.argv));
const del = require('del');
const merge = require('merge2');
const path = require('path');
require('dotenv').config()

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
const projectConfig = require('./projects.json');

const projectNames = Object.keys(projectConfig);

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

function runCommand(command, options, callback) {
    const exec = require('child_process').exec;
    exec(command, options, function (error, stdout, stderr) {
        console.log(`${path.resolve(options.cwd || '.')} ${chalk.cyan(command)}`);
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log('exec error: ', error);
        }
        callback();
    });
}

let resolver;

function getDependencyList(project) {
    if (resolver === undefined) {
        const DependencyResolver = require('dependency-resolver');
        resolver = new DependencyResolver();
        projectNames.forEach(name => resolver.add(name));
        projectNames.forEach(projectName => {
            (projectConfig[projectName].dependencies || []).forEach(dep => {
                resolver.setDependency(project, dep);
            });
        });
    }
    return resolver.resolve(project);
}

/**
 * {cmd: "", cwd: ""}
 */
function runCommands(commands, parallel, callback) {
    const async = require('async');
    if (parallel === true) {
        async.each(commands, function (command, done) {
            runCommand(command.cmd, { cwd: command.cwd }, done);
        }, function () {
            callback();
        });
    } else {
        async.eachSeries(commands, function (command, done) {
            runCommand(command.cmd, { cwd: command.cwd }, done);
        }, function () {
            callback();
        });
    }
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

function debugTask(project, debug, port) {

    const debugScope = debug || process.env.DEBUG || 'droplit:*';
    if (project === undefined)
        return console.log('You must specify a project');
    console.log(`debugging projects/${project} with DEBUG=${debugScope}`);
    // Allow shorthand project names (`ioe` => `ioe-droplit-io`)

    if (projectConfig[`${project}-droplit-io`])
        project = `${project}-droplit-io`;

    console.log('starting project', project);

    const args = {
        script: `${project}.js`,
        ext: 'js',
        env: {
            APP_NAME: project,
            ENVIRONMENT: 'development',
            DEBUG: debugScope
        },
        delay: 1, // Sec
        watch: [
            `projects/${escapeAt(project)}`
        ],
        ignore: [
            `projects/${escapeAt(project)}/src`,
            `projects/${escapeAt(project)}/node_modules`,
            `projects/${escapeAt(project)}/nodemon_ignore`
        ]
    };
    if (port) {
        args.env.PORT = port;
    }
    if (!projectConfig[project]) {
        console.error(`"${project}" is not a valid project.`);
        process.exit(1);
    }
    // Watch project dependencies for changes
    if (projectConfig[project].dependencies) {
        projectConfig[project].dependencies.forEach(dep => {
            // Watch
            args.watch.push(`projects/${dep}`);
            // Ignore
            args.ignore.push(`projects/${dep}/src`);
            args.ignore.push(`projects/${dep}/node_modules`);
            args.ignore.push(`projects/${dep}/nodemon_ignore`);
        });
    }


    G$.nodemon(args);
}

function defaultTask(callback) {
    console.log('default')
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
    G$.sequence('init-main', 'build-main', callback);
}

// Setup tasks
gulp.task('setup', 'Install all modules', setupTask);
gulp.task('teardown', 'Clean all', teardownTask);

function setupTask(callback) {
    G$.sequence('install', callback);
}

function teardownTask(callback) {
    G$.sequence('deepclean', callback);
}

// NPM install tasks
gulp.task('install', 'Install all npm modules', installTask);
gulp.task('install-main', false, installMainTask);

function installTask(callback) {
    const commands = [];
    projectNames.forEach(name => {
        commands.push({ cmd: 'npm install', cwd: `projects/${name}` });
    });
    runCommands(commands, true, callback);
}

function installMainTask(callback) {
    const deps = getDependencyList(APP_NAME);
    deps.push(APP_NAME);
    const commands = [];
    deps.forEach(name => {
        // npm install
        commands.push({ cmd: 'npm install', cwd: `projects/${name}` });
    });
    runCommands(commands, true, callback);
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
    const linkCommands = [];
    const packageLinkCommands = [];
    projectNames.forEach(project => {
        linkCommands.push({ cmd: `npm ${mode ? 'link' : 'unlink'}`, cwd: `projects/${project}` });
    });
    if (mode) {
        projectNames.forEach(project => {
            if (projectConfig[project].dependencies) {
                const deps = projectConfig[project].dependencies.map(dep => require(`./projects/${dep}/package.json`).name);
                packageLinkCommands.push({ cmd: `npm ${mode ? 'link' : 'unlink'} ${deps.join(' ')}`, cwd: `projects/${project}` });
            }
        });
    }
    runCommands(linkCommands, true, () => {
        runCommands(packageLinkCommands, true, callback);
    });
}

// Linting tasks
gulp.task('tslint', 'Lints all TypeScript source files', tsLintTask);

// Generate project lint tasks
const tsLintTasks = {};
projectNames.forEach(name => {
    tsLintTasks[name] = function () {
        return gulp.src(expandPaths(settings.tsfiles, [name]))
            .pipe(G$.tslint({ formatter: 'stylish' }))
            .pipe(G$.tslint.report({ emitError: false }));
    };
    gulp.task(`tslint-${name}`, `Lints all ${chalk.green(name)} TypeScript source files `, tsLintTasks[name]);
});

function tsLintTask() {
    return gulp.src(expandPaths(settings.tsfiles))
        .pipe(G$.tslint({
            formatter: 'stylish'
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
projectNames.forEach(name =>
    gulp.task(`build-${name}`, `Compiles all ${chalk.green(name)} TypeScript source files and updates module references`, function (callback) {
        G$.sequence([`tslint-${name}`, `ts-${name}`], callback);
    })
);

function buildTask(callback) {
    G$.sequence(['tslint', 'clean'], 'ts-all', callback);
}

function buildMainTask(callback) {
    return G$.sequence(`ts-${APP_NAME}`)(callback);
}

function watchTask(project) {
    const startTime = new Date();
    if ((project === undefined) || (project === '*'))
        project = 'all';

    // Determine scope of watch
    const targets = (project === 'all') ?
        projectNames.filter(name => !projectConfig[name].excludeInMainBuild) :
        Array.from(new Set([project].concat(getDependencyList(project))));

    const tasks = (project === 'all') ?
        [['clean', 'tslint'], 'ts-all'] :
        [['clean', ...targets.map(target => `tslint-${target}`)], `ts-${project}`];

    // Execute build tasks
    G$.sequence(...tasks, () => {
        targets.forEach(name =>
            gulp.watch(mapPaths(settings.watchFiles, name, true), [`tslint-${name}`, `ts-${name}`]));
        debug(`** ready after ${Math.round((new Date() / 1000) - (startTime / 1000))} seconds ** `);
    });
}

// Cleaning tasks
gulp.task('clean', 'Cleans the generated files from lib directory', cleanTask);
gulp.task('clean-main', false, cleanMainTask);
gulp.task('deepclean', 'Cleans the generated files from lib directory and all node_modules', deepCleanTask);
gulp.task('test-clean', 'Cleans the generated files from lib directory', testCleanTask);

projectNames.forEach(name => {
    gulp.task(`clean-${name}`, `Cleans the ${name} project generated files from lib directory`, function () {
        return cleanTask(name);
    });
});

function cleanTask(project) {
    const projects = project ? [project] : projectNames;
    return del(expandPaths(settings.clean, projects), { dot: true });
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
const mainTsTasks = projectNames
    .filter(name => (!projectConfig[name].excludeInMainBuild) || (name === APP_NAME));

gulp.task('ts-all', 'Transpile all projects', transpileProjects(mainTsTasks));

function transpileProjects(projects, tsfiles = settings.tsfiles, resfiles = settings.resources) {
    return function () {
        const inProduction = APP_NAME !== undefined;
        if (inProduction)
            tsconfig.compilerOptions.isolatedModules = true;

        const targets = Array.from(new Set(projects.reduce((list, project) => list.concat(project, ...getDependencyList(project)), [])));
        const tsSources = Array.from(new Set(targets.reduce((globs, project) => globs.concat(mapPaths(tsfiles, project)), [])));
        const resources = Array.from(new Set(targets.reduce((globs, project) => globs.concat(mapPaths(resfiles, project)), [])));

        const tsResult = gulp.src(tsSources)
            .pipe(G$.sourcemaps.init({ identityMap: true }))
            .pipe(G$.typescript.createProject(tsconfig.compilerOptions)());

        const destTrans = file =>
            path.relative(file.cwd, file.base).replace(/projects(?:\\|\/)(.+?)(?:\\|\/)src(?:\\|\/.+)?/, 'projects\/$1\/lib\/');

        if (inProduction)
            return merge([
                // .js files, no sourcemaps, no .d.ts files
                tsResult.js.pipe(gulp.dest(destTrans)),
                // all other files
                gulp.src(resources).pipe(gulp.dest(destTrans))
            ]);

        return merge([
            tsResult.dts.pipe(gulp.dest(destTrans)),
            // .js files + sourcemaps
            settings.inlineSourcemaps ?
                tsResult.js
                    .pipe(G$.sourcemaps.write({
                        includeContent: false,
                        sourceRoot: '../src'
                    })) // separate .js.map files
                    .pipe(gulp.dest(destTrans)) :
                tsResult.js
                    .pipe(G$.sourcemaps.write('.', {
                        includeContent: false,
                        sourceRoot: '../src'
                    })) // separate .js.map files
                    .pipe(gulp.dest(destTrans)),
            // all other files
            gulp.src(resources).pipe(gulp.dest(destTrans))
        ]);
    };
}

// Generate project ts tasks
const tsTasks = {};
projectNames.forEach(name =>
    gulp.task(`ts-${name}`, `Transpile ${chalk.green(name)}`, transpileProjects([name])));

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
                        sourceRoot: function (file) { return `${file.cwd}/src`; }
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
        major: 'when you make incompatible API changes',
        minor: 'when you add functionality in a backwards - compatible manner',
        patch: 'when you make backwards - compatible bug fixes',
        project: `Project name: ${chalk.green(projectNames.join(chalk.white(', ')))}`
    }
};

gulp.task('bump', 'Version bump a project.', function (major, minor, patch, project) {
    if (!project)
        return console.log(`${chalk.red('No project specified!')}`);

    const typeFlags = { 1: 'major', 2: 'minor', 4: 'patch' };
    const typeValue = (major << 0) + (minor << 1) + (patch << 2);
    const type = typeFlags[typeValue];
    if (!type)
        return console.log(`${chalk.red('Specify one version type to bump!')}`);

    const cwd = `projects/${project}/`;
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
