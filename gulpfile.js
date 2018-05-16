const gulp = require('gulp');
const parameterized = require('gulp-parameterized');

const colors = require('ansi-colors');
const del = require('del');
const { exec } = require('child_process');
const log = require('fancy-log');
const merge = require('merge2');
const path = require('path');
const fs = require('fs');

const G$ = require('gulp-load-plugins')({ lazy: true });

const projects = require('./projects.json');
const settings = require('./gulp.json');
const tsconfig = require('./tsconfig.master.json');

const projectNames = Object.keys(projects);
let resolver;

let APP_NAME = process.env.APP_NAME;
const PROJECT_VAR = '{project}';

let localconfig = undefined;
const localconfigExists = fs.existsSync('./localconfig.json')
if (localconfigExists) {
    localconfig = require('./localconfig.json');
}

/* Build */
const buildMain = done => {
    const deps = Array.from(new Set([APP_NAME, ...getDependencyList(APP_NAME)]));
    return gulp.parallel(...deps.map(d => `ts-${d}`))(done);
};

/* Cleaning */
const clean = project => () => del(expandGlobs(settings.clean, project), { dot: true });
const cleanTask = (done, args) => clean(args.project)();
const cleanMain = () => del(expandGlobs(settings.cleanMain), { dot: true });
const deepClean = () => del(expandGlobs(settings.deepClean), { dot: true });
const testClean = () => del(expandGlobs(settings.testClean), { dot: true });

/* Code analysis */
const stats = (done, params) => {
    if (params.project) {
        console.log(`Source Lines of Code: ${colors.green(params.project)}`);
        return gulp.src(mapPaths(settings.sloc_project, params.project)).pipe(G$.sloc({ tolerant: true }));
    }

    console.log(`Source Lines of Code: ${colors.white('ALL')}`);
    return gulp.src(settings.sloc_all).pipe(G$.sloc({ tolerant: true }));
};

/* Debug */
const debug = (done, params) => {
    const debugScope = params.debug || 'droplit:*';
    let { project } = params;

    if (project === undefined) {
        console.error('You must specify a project');
        return done();
    }

    // Allow shorthand names (`ioe` => `ioe-droplit-io`)
    if (projects[`${project}-droplit-io`])
        project = `${project}-droplit-io`;

    console.info(`debugging projects/${params.project} with DEBUG=${debugScope}`);

    const watch = [`projects/${escapeAtSign(project)}`];
    const ignore = [
        `projects/${escapeAtSign(project)}/src`,
        `projects/${escapeAtSign(project)}/node_modules`
    ];

    // Add dependencies to watch
    if (projects[project].dependencies)
        projects[project].dependencies.forEach(dep => {
            watch.push(`projects/${dep}`);
            ignore.push(`projects/${dep}/src`, `projects/${dep}/node_modules`);
        });

    const args = {
        script: `${project}.js`,
        ext: 'js',
        env: {
            DEBUG: debugScope,
            NODE_ENV: 'development',
            PORT: params.port || 3000
        },
        delay: 1, // Sec
        watch,
        ignore
    }

    if (localconfig) {
        Object.assign(args.env, localconfig['process.env'])
    }

    G$.nodemon(args);
};

/* Dependencies */
const npmInstall = (done, params) => {
    if (!params.pack || !params.project) {
        console.error('Must specify a package and project');
        return done();
    }

    runCommand(`npm install --save ${params.pack}`, { cwd: mapPath(settings.projectPath, params.project) }, done);
};

const npmUninstall = (done, params) => {
    if (!params.pack || !params.project) {
        console.error('Must specify a package and project');
        return done();
    }

    runCommand(`npm uninstall --save ${params.pack}`, { cwd: mapPath(settings.projectPath, params.project) }, done);
};

/* Deployment */
const deploySimulate = (done, args) => {
    const { project } = args;
    if (!project) {
        console.error('You must specify a project with --project');
        return done();
    }

    APP_NAME = project;
    return gulp.series(cleanMain, gulp.parallel(installMain, initMain), buildMain)(done);
};

const initMain = () => gulp
    .src(`${escapeAtSign(APP_NAME)}.js`)
    .pipe(G$.rename('index.js'))
    .pipe(gulp.dest('.'));

const startup = done => gulp.series(cleanMain, gulp.parallel(installMain, initMain), buildMain)(done);

/* Linting */
const tsLint = () => gulp
    .src(expandGlobs(settings.tsfiles))
    .pipe(G$.tslint({ formatter: 'verbose' }))
    .pipe(G$.tslint.report({ emitError: false }));

const tsLintTasks = projectNames.reduce((tasks, project) => {
    const tsLint = () => gulp
        .src(expandGlobs(settings.tsfiles, [project]))
        .pipe(G$.tslint({ formatter: 'verbose' }))
        .pipe(G$.tslint.report({ emitError: false }));
    tasks[project] = tsLint;
    return tasks;
}, {});

/* NPM Tasks */
const install = done => {
    gulp.parallel(
        [...projectNames]
            .map(command => {
                const run = cb =>
                    runCommand('npm install', { cwd: `projects/${command}` }, cb);
                run.displayName = `install-${command || 'root'}`;
                return run;
            })
    )(done);
};

// Installs `project.json` dependencies for each project
const installMain = done => {
    const deps = Array.from(new Set([APP_NAME, ...getDependencyList(APP_NAME)]));
    const commands = deps.map(name => {
        const installFn = cb => runCommand('npm install', { cwd: `projects/${name}` }, cb);
        installFn.displayName = `install-${name}`;
        return installFn;
    });

    return gulp.parallel(...commands)(done);
};

const link = done => { linker(true, done); };

const unlink = done => { linker(false, done); };

/* Testing */
const test = () => {
    log(colors.cyan(`Testing ${wildcharPaths(settings.testFiles)}`));
    return gulp
        .src(wildcharPaths(settings.testFiles), { read: true })
        .pipe(G$.mocha({ reporter: 'spec' }));
};

/* Transpiling */
const transpileProjects = (projects, tsfiles = settings.tsfiles, resfiles = settings.resources) => () => {
    const inProduction = APP_NAME !== undefined;
    if (inProduction)
        tsconfig.compilerOptions.isolatedModules = true;

    const tsSources = Array.from(new Set(projects.reduce((globs, project) => globs.concat(mapPaths(tsfiles, project)), [])));
    const resources = Array.from(new Set(projects.reduce((globs, project) => globs.concat(mapPaths(resfiles, project)), [])));

    const tsResult = gulp.src(tsSources)
        .pipe(G$.sourcemaps.init())
        .pipe(G$.sourcemaps.identityMap())
        .pipe(G$.typescript.createProject(tsconfig.compilerOptions)());

    const destTrans = file =>
        file.base.replace(/.+?(?:\\|\/)projects(?:\\|\/)(.+?)(?:\\|\/)src(?:\\|\/.+)?/, 'projects\/$1\/lib\/');

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

/* Version bumb */
const bump = (done, params) => {
    if (!params.project) {
        console.error(`${colors.red('No project specified!')}`);
        return done();
    }
    const typeFlags = { 1: 'major', 2: 'minor', 4: 'patch' };
    const typeValue = (params.hasOwnProperty('major') << 0) + (params.hasOwnProperty('minor') << 1) + (params.hasOwnProperty('patch') << 2);
    const typeName = typeFlags[typeValue];
    if (!typeName) {
        console.error(`${colors.red('Specify one version type to bump!')}`);
        return done();
    }

    const cwd = `projects/${params.project}/`;
    return gulp.src('./package.json', { cwd })
        .pipe(G$.bump({ type: typeName }))
        .pipe(gulp.dest('./', { cwd }));
};

/* Watch */
const watch = (done, params) => {
    const startTime = new Date();
    let { project } = params;
    if (project === undefined)
        project = 'all';

    const targets = ((project === '*') || (project === 'all')) ?
        projectNames.filter(name => !projects[name].excludeInMainBuild) :
        Array.from(new Set([project].concat(getDependencyList(project))));

    const tasks = [];
    if ((project === '*') || (project === 'all'))
        tasks.push('build');
    else {
        const transpiler = transpileProjects(targets);
        transpiler.displayName = 'transpile-targets';
        tasks.push(gulp.parallel('clean', ...targets.map(target => `tslint-${target}`)), transpiler)
    }

    const beginWatch = () => {
        targets.forEach(target =>
            gulp.watch(mapPaths(settings.watchFiles, target, true), gulp.parallel(`tslint-${target}`, `ts-${target}`)));
        log(`** ready after ${Math.round((new Date() / 1000) - (startTime / 1000))} seconds ** `);
    };
    beginWatch.displayName = 'begin-watch';

    return gulp.series(...tasks, beginWatch)(done);
};

/* Miscellaneous */
const defaultTask = done => {
    if (APP_NAME)
        return gulp.series(startup)(done);
    return gulp.series(help)(done);
};

const help = done => runCommand('gulp --tasks', { cwd: './' }, done);

/* Configure tasks */
const projectTaskOptions = {
    '--project': `Project name: ${projectNames.map(n => colors.green(n)).join(', ')}`
};

gulp.task('install', install);
gulp.task('install').description = 'Install all npm modules';

gulp.task('link', link);
gulp.task('link').description = 'Link dependencies on local disk';

gulp.task('unlink', unlink);
gulp.task('unlink').description = 'Unlink dependencies on local disk';

gulp.task('clean', parameterized(cleanTask));
gulp.task('clean').description = 'Cleans the generated files from lib directory';
gulp.task('clean').flags = projectTaskOptions;

// Generate project-specific clean tasks
projectNames.forEach(project => {
    gulp.task(`clean-${project}`, clean(project));
    gulp.task(`clean-${project}`).description = `Cleans the ${project} project generated files from lib directory`;
});

gulp.task('deepclean', deepClean);
gulp.task('deepclean').description = 'Cleans the generated files from lib directory and all node_modules';

gulp.task('setup', gulp.series('install', 'link'));
gulp.task('setup').description = 'Install all modules and link projects';

gulp.task('teardown', gulp.series('unlink', 'deepclean'));
gulp.task('teardown').description = 'Clean all and unlink projects';

gulp.task('tslint', tsLint);
gulp.task('tslint').description = 'Lints all TypeScript source files';

// Generate project-specific lint tasks
Object.keys(tsLintTasks).forEach(task => {
    gulp.task(`tslint-${task}`, tsLintTasks[task]);
    gulp.task(`tslint-${task}`).description = `Lints all ${colors.green(task)} TypeScript source files`;
});

// Generate project-specific transpiling tasks
projectNames.forEach(project => {
    gulp.task(`ts-${project}`, transpileProjects([project]));
    gulp.task(`ts-${project}`).description = `Transpile ${colors.green(project)}`;
});

const mainTsTasks = projectNames
    .filter(project => !projects[project].excludeInMainBuild || (project === APP_NAME));

gulp.task('ts-all', transpileProjects(mainTsTasks));
gulp.task('ts-all').description = 'Transpile all projects';

gulp.task('build', gulp.series(gulp.parallel('tslint', 'clean'), 'ts-all'));
gulp.task('build').description = 'Compiles all TypeScript source files and updates module references';

projectNames.forEach(project => {
    gulp.task(`build-${project}`, gulp.parallel(`tslint-${project}`, `ts-${project}`));
    gulp.task(`build-${project}`).description = `Compiles all ${colors.green(project)} TypeScript source files and updates module references`;
});

gulp.task('watch', parameterized(watch));
gulp.task('watch').description = 'Contiuous build';
gulp.task('watch').flags = projectTaskOptions;

gulp.task('debug', parameterized(debug));
gulp.task('debug').description = 'Run the project and auto-restart for changes';
gulp.task('debug').flags = {
    '--debug': `The scope to use for debug logging: (ex. ${colors.green('droplit:*')})`,
    '--project': `Project name: ${projectNames.map(n => colors.green(n)).join(', ')}`,
    '--port': 'The port to run services on'
};

gulp.task('test-clean', testClean);
gulp.task('test-clean').description = 'Cleans the generated files from lib directory';

gulp.task('test-build', transpileProjects(projectNames, settings.testFiles, settings.testResources));
gulp.task('test-build').description = 'Transpile all test files';

gulp.task('test', gulp.series('test-clean', 'test-build', test));
gulp.task('test').description = 'Runs all tests';

gulp.task('deploy-simulate', parameterized(deploySimulate));
gulp.task('deploy-simulate').description = 'Simulate a deployment';
gulp.task('deploy-simulate').flags = projectTaskOptions;

const installFlags = {
    '--pack': 'Package name',
    '--project': `Project name: (ex. ${colors.green(projectNames[0])})`
};

gulp.task('npm-i', npmInstall);
gulp.task('npm-i').description = `Install and save a ${colors.cyan('pack')}age to a ${colors.cyan('project')}`;
gulp.task('npm-i').flags = installFlags;

gulp.task('npm-u', npmUninstall);
gulp.task('npm-u').description = `Uninstall and save a ${colors.cyan('pack')}age to a ${colors.cyan('project')}`;
gulp.task('npm-u').flags = installFlags;

gulp.task('bump', parameterized(bump));
gulp.task('bump').description = 'Version bump a project';
gulp.task('bump').flags = {
    '--major': 'when you make incompatible API changes',
    '--minor': 'when you add functionality in a backwards-compatible manner',
    '--patch': 'when you make backwards-compatible bug fixes',
    '--project': `Project name: (ex. ${colors.green(projectNames[0])})`
};

gulp.task('stats', parameterized(stats));
gulp.task('stats').description = 'Get lines of code';
gulp.task('stats').flags = projectTaskOptions;

gulp.task('default', defaultTask);

/* Auxiliary functions */
function escapeAtSign(project) {
    return project[0] === '@' ? `/${project}` : project;
}

function expandGlobs(globs, projects) {
    projects = projects ? Array.isArray(projects) ? projects : [projects] : projectNames;
    return globs.reduce((p, c) =>
        p.concat(...(
            (c.indexOf(PROJECT_VAR) > 0) ? projects.map(name => c.replace(PROJECT_VAR, escapeAtSign(name))) : [c])
        ), []);
}

function getDependencyList(project) {
    if (resolver === undefined) {
        const DependencyResolver = require('dependency-resolver');
        resolver = new DependencyResolver();
        projectNames.forEach(name => resolver.add(name));
        projectNames
            .filter(name => projects[name].hasOwnProperty('dependencies')) // Only add for projects with dependencies
            .reduce((p, c) => // Convert to flattened list of proj/dependency pairs ['proj1', 'proj2', ...] => [{ project: 'proj1', dependency: 'dep1'}, ...]
                p.concat(...projects[c].dependencies.map(d => ({ project: c, dependency: d }))), [])
            .forEach(pair => resolver.setDependency(pair.project, pair.dependency)); // Add dependencies to resolver
    }
    return resolver.resolve(project);
}

const linker = (mode, done) => {
    const projectLinks = projectNames.map(project => {
        const linkPhrase = mode ? 'link' : 'unlink';
        const run = cb =>
            runCommand(`npm ${linkPhrase} --no-bin-links`, { cwd: `projects/${project}` }, cb);
        run.displayName = `${linkPhrase}-${project}`;
        return run;
    });

    const tasks = [gulp.parallel(projectLinks)];
    if (mode) {
        const dependencyLinks = projectNames
            .filter(p => projects[p].hasOwnProperty('dependencies'))
            .reduce((p, c) =>
                p.concat(...projects[c].dependencies.map(dependency => {
                    const { name } = require(`./projects/${dependency}/package.json`); // eslint-disable-line global-require
                    const run = cb =>
                        runCommand(`npm link ${name} --no-bin-links`, { cwd: `projects/${c}` }, cb);
                    run.displayName = `link:${name}->${c}`;
                    return run;
                })), []
            );
        if (dependencyLinks.length > 0)
            tasks.push(dependencyLinks);
    }

    gulp.series(tasks)(done);
};

function mapPath(glob, project, escapePaths) {
    return glob.replace(PROJECT_VAR, escapePaths ? escapeAtSign(project) : project);
}

function mapPaths(globs, project, escapePaths) {
    return globs.map(glob => mapPath(glob, project, escapePaths));
}

function runCommand(command, options, callback) {
    try {
        exec(command, options, (error, stdout, stderr) => {
            console.log(`${path.resolve(options.cwd || '.')} ${colors.cyan(command)}`);
            console.log(stdout);
            console.error(stderr);
            if (error)
                console.log('exec error: ', error);
            callback();
        });
    } catch (ex) {
        console.error('run command', ex);
    }
}

function wildcharPaths(globs) {
    return globs.map(glob => (glob.indexOf(PROJECT_VAR) > 0) ? glob.replace(PROJECT_VAR, '*') : glob);
}