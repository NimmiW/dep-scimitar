var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;
const depCheck = require( 'depcheck' );
const chalk = require( 'chalk' );
const core = require('@actions/core');
const shell = require('shelljs');
const { exec } = require('child_process')
const axios = require('axios');


var repo_path = process.cwd();
var hooks_path = path.join(repo_path, '.git/hooks');
var commit_msg_hook_file = path.join(hooks_path, "commit-msg");
var node_path = process.argv[0];
var commit_msg_hook_content = "#!/bin/sh "
    + "\nnpx dep-scimitar run";

function on() {

    CheckRepo();

    if (!isHookExist()) {
        writeHook();
    }
    else if (isInstalled()) {
        console.log("Dep-sCImitar is already enabled for:",repo_path);
    }
    else {
        makeBackupHook();
        writeHook();
    }
}

function off() {

    CheckRepo();

    if (isHookExist()) {
        if (isHookModified()) {
            makeBackupHook();
        } else {
            deletHook();
        }
        console.log("Dep-sCImitar is successfully disabled for:", repo_path);
    } else {
        console.log("Dep-sCImitar is already disabled for:", repo_path);
    }
}

function CheckRepo() { //used
    if (!fs.existsSync(hooks_path)) {
        console.log('Worn!', "Dep-sCImitar cannot find git repository in this directory.");
        process.exit(1);
    }
}

function isHookExist() { //used
    return fs.existsSync(commit_msg_hook_file);
}

function isInstalled() { //used
    var hook = fs.readFileSync(commit_msg_hook_file);
    return hook.indexOf("npx dep-scimitar run") > -1;
}

function isHookModified() { //used
    var hook = fs.readFileSync(commit_msg_hook_file);
    return hook !== commit_msg_hook_content;
}

function writeHook() { //used
    fs.writeFileSync(commit_msg_hook_file, commit_msg_hook_content, {mode: '777'});
    console.log("Dep-sCImitar is successfully enabled for:", repo_path);
}

function makeBackupHook() { //used
    fs.renameSync(commit_msg_hook_file, commit_msg_hook_file + '_' + new Date() + '.backup');
}


function getBuildStatus(ciObjs) {
	let statuses = [];
	try {
	  for (const obj of ciObjs) {
		statuses.push(obj['conclusion']);
	  }
	  statuses = statuses.filter(s => s !== "skipped");
	  
	  if (statuses.every(status => status === statuses[0])) {
		return statuses[0];
	  } else {
		return "failure";
	  }
	} catch (error) {
	  return null;
	}
}
  
async function fetchAndCalculateStatus(apiUrl) {
	try {
	  const response = await axios.get(apiUrl);
	  const ciStatus = getBuildStatus(response.data.check_runs);
	  return ciStatus;
	} catch (error) {
	  console.error('Axios error:', error);
	  return null;
	}
}

async function run() {
    try {
        const t = execSync("git diff --cached --name-status", { encoding: 'utf8' });
        const lines = t.split('\n');

        for (const line of lines) {
            const match = line.match(/(.*)\t(.*)/);
            if (match) {
                const [, action, file] = match;
                const result = await checkCommit(action, file);



                if (result === 1) {
                          const commit_msg = fs.readFileSync('.git/COMMIT_EDITMSG', 'utf8');
                          if (!/(\[skip ci\])|(\[ci skip\])/i.test(commit_msg)) {
                              fs.appendFileSync('.git/COMMIT_EDITMSG', ' [ci skip]');
                          }
                }
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function checkCommit(full, action, file) {
    return new Promise((resolve, reject) => {
    // Execute your Python script here
    const cwd = process.cwd();
    const packageJson = require( path.join( cwd, 'package.json' ) );
    const nonExistingCSSFiles = [];
  
    const depCheckOptions = {
      ignoreDirs: [ 'docs', 'build' ],
      ignoreMatches: [ 'eslint', 'eslint-plugin-ckeditor5-rules', 'husky', 'lint-staged', 'webpack-cli' ]
    };
  
    if ( Array.isArray( packageJson.depcheckIgnore ) ) {
      depCheckOptions.ignoreMatches.push( ...packageJson.depcheckIgnore );
    }
  
    console.log( 'Checking dependencies...' );
  
    depCheck( cwd, depCheckOptions )
      .then( unused => {
  
        const unusedDependencies = mergeLists(unused.dependencies, unused.devDependencies)
  
        const gitDiffCommand = 'git diff --name-only HEAD^..HEAD';
  
        exec(gitDiffCommand, { cwd: cwd }, (error, stdout, stderr) => {
        
          const changedFiles = stdout.split('\n').filter(Boolean);
  
          var one_dep_upgrade
          const contains_pkg_json = changedFiles.indexOf("package.json") !== -1
          const contains_pkg_loc_json = changedFiles.indexOf("package-lock.json") !== -1
          if (contains_pkg_json & contains_pkg_loc_json & changedFiles.length==2 ){
            one_dep_upgrade = true
          } else if (contains_pkg_json & changedFiles.length==1){
            one_dep_upgrade = true
          }
  
          var result = 0
  
          const gitRevSha = "git log -n 1 --format=\"%H\"";
          exec(gitRevSha, { cwd: cwd }, (error, stdout2, stderr) => {
  
            const parent_sha = stdout2.replace("\n", "")
            // console.log("parent_sha",parent_sha)
  
            const gitShow = "git show "+parent_sha+":package.json";
            // console.log(gitShow)
            exec(gitShow, { cwd: cwd }, (error, stdout3, stderr) => {
                // console.log("stdout3",stdout3)
                // console.log("stderr",stderr)
                stdout3 = JSON.parse(stdout3)
                // console.log("stdout3",stdout3)
  

                fs.readFile("package.json", (error, stdout33, stderr) => {
  
                  stdout33 = JSON.parse(stdout33)
                //   console.log("stdout33",stdout33)
  
                  parent_dependencies = mergeObjects(
                    stdout3['devDependencies'],stdout3['dependencies']
                  )
  
                  console.log("parent_dependencies",parent_dependencies)
  
                  current_dependencies = mergeObjects(
                    stdout33['devDependencies'],stdout33['dependencies']
                  )
  
                  console.log("current_dependencies",current_dependencies)
  
                  const changedDependencies = findChangedDependencies(parent_dependencies,current_dependencies)
                  console.log("changedDependencies",changedDependencies)
                  console.log("unusedDependencies",unusedDependencies)
  
                  if (changedDependencies.length == 1){
                    const changedDependency = changedDependencies[0]['dependency']
                    const isChangedDependencyUnused = unusedDependencies.includes(changedDependency);
                    if (isChangedDependencyUnused){
                      result = 1
                    }
                  }
                  console.log("result", result)

                  if (result== 0) {
                    console.log('✗', action, file);
                    console.log('➜', 'can not skip (code was modifed)');
                    resolve(0) 
                    
                    
                  } else {
                    const gitRemote = "git remote get-url origin"
                    var cwd = process.cwd()
                    exec(gitRemote, { cwd: cwd }, (error, repoUrl, stderr) => {
                      console.log(repoUrl)
                      const parts = repoUrl.split("/");
                      const owner = parts[3];
                      const repoName = parts[4].replace(".git", "");
                      // const sha = "4d8b8834d065bc65ba24f2c49979ce7aab97d13e" //TODO
                      const apiUrl = 'https://api.github.com/repos/'+owner+"/"+repoName+"/commits/"+parent_sha+'/check-runs';
                      console.log("apiUrl",apiUrl)

                      fetchAndCalculateStatus(apiUrl)
                        .then(ciStatus => {
                          console.log("ci_status", ciStatus);
                          if (ciStatus=="success"){
                            console.log('✓', action, file,'(format was modifed)');
                            resolve(1) 
                          } else {
                            console.warn('➜', 'You are changing the version of an unused dependency.')
                            resolve(0) 
                          }
                    
                        });

                    })
                   
                  }
                })
            
            })

          })
        });   
    } ); 

})
 }


function mergeLists(list1, list2) {
    if (!list1 && !list2) {
      return [];
    } else if (!list1) {
      return list2;
    } else if (!list2) {
      return list1;
    } else {
      return list1.concat(list2)
    }
}
  
function mergeObjects(obj1, obj2) {
    return Object.assign({}, obj1, obj2);
}
  
function findChangedDependencies(previousDeps, currentDeps) {
    const changedDependencies = [];
  
    for (const dependency in previousDeps) {
      if (
        currentDeps.hasOwnProperty(dependency) &&
        previousDeps[dependency] !== currentDeps[dependency]
      ) {
        changedDependencies.push({
          dependency,
          previousVersion: previousDeps[dependency],
          currentVersion: currentDeps[dependency]
        });
      }
    }
  
    return changedDependencies;
}

async function runRemote() {
  // Execute your Python script here
  const cwd = process.cwd();
  const packageJson = require( path.join( cwd, 'package.json' ) );
  const nonExistingCSSFiles = [];

  const depCheckOptions = {
    ignoreDirs: [ 'docs', 'build' ],
    ignoreMatches: [ 'eslint', 'eslint-plugin-ckeditor5-rules', 'husky', 'lint-staged', 'webpack-cli' ]
  };

  if ( Array.isArray( packageJson.depcheckIgnore ) ) {
    depCheckOptions.ignoreMatches.push( ...packageJson.depcheckIgnore );
  }

  // console.log( 'Checking dependencies...' );

  depCheck( cwd, depCheckOptions )
    .then( unused => {

      const unusedDependencies = mergeLists(unused.dependencies, unused.devDependencies)

      const gitDiffCommand = 'git diff --name-only HEAD^..HEAD';

      exec(gitDiffCommand, { cwd: cwd }, (error, stdout, stderr) => {
      
        const changedFiles = stdout.split('\n').filter(Boolean);

        var one_dep_upgrade = false
        const contains_pkg_json = changedFiles.indexOf("package.json") !== -1
        const contains_pkg_loc_json = changedFiles.indexOf("package-lock.json") !== -1
        if (contains_pkg_json & contains_pkg_loc_json & changedFiles.length==2 ){
          one_dep_upgrade = true
        } else if (contains_pkg_json & changedFiles.length==1){
          one_dep_upgrade = true
        }

        var result = 0

        const gitRevSha = "git log -n 1 --format=\"%P\"";
        exec(gitRevSha, { cwd: cwd }, (error, stdout2, stderr) => {

          const parent_sha = stdout2.replace("\n", "")
          // console.log("parent_sha",parent_sha)

          const gitCurrentSha = "git log -n 1 --format=\"%H\"";
          exec(gitCurrentSha, { cwd: cwd }, (error, stdout22, stderr) => {
  
            const current_sha = stdout22.replace("\n", "")
            // console.log("current_sha",current_sha)

            const gitShow = "git show "+parent_sha+":package.json";
            // console.log(gitShow)
            exec(gitShow, { cwd: cwd }, (error, stdout3, stderr) => {
              // console.log("stdout3",stdout3)
              // console.log("stderr",stderr)
              stdout3 = JSON.parse(stdout3)
              // console.log("stdout3",stdout3)

              const gitShowCurrent = "git show "+current_sha+":package.json";
              exec(gitShowCurrent, { cwd: cwd }, (error, stdout33, stderr) => {

                stdout33 = JSON.parse(stdout33)
                // console.log("stdout33",stdout33)

                parent_dependencies = mergeObjects(
                  stdout3['devDependencies'],stdout3['dependencies']
                )

                // console.log("parent_dependencies",parent_dependencies)

                current_dependencies = mergeObjects(
                  stdout33['devDependencies'],stdout33['dependencies']
                )

                // console.log("current_dependencies",current_dependencies)

                const changedDependencies = findChangedDependencies(parent_dependencies,current_dependencies)
                // console.log("changedDependencies",changedDependencies)
                // console.log("unusedDependencies",unusedDependencies)

                if (changedDependencies.length == 1){
                  const changedDependency = changedDependencies[0]['dependency']
                  const isChangedDependencyUnused = unusedDependencies.includes(changedDependency);
                  if (isChangedDependencyUnused){
                    result = 1
                  }
                }


                const status = 'DEPUPGRADECHECK_SKIP_STATUS';
                if (result== 0) {
                  // Set the value of the environment variable
                  process.env[status] = "FALSE"
                  console.log(result)
                } else if (result == 1) {


                  

                  const gitRemote = "git remote get-url origin"
                  var cwd = process.cwd()
                  exec(gitRemote, { cwd: cwd }, (error, repoUrl, stderr) => {
                    console.log(repoUrl)
                    const parts = repoUrl.split("/");
                    const owner = parts[3];
                    const repoName = parts[4].replace(".git", "");
                    // const sha = "4d8b8834d065bc65ba24f2c49979ce7aab97d13e" //TODO
                    const apiUrl = 'https://api.github.com/repos/'+owner+"/"+repoName+"/commits/"+parent_sha+'/check-runs';
                    console.log("apiUrl",apiUrl)

                    fetchAndCalculateStatus(apiUrl)
                      .then(ciStatus => {
                        console.log("ci_status", ciStatus);
                        if (ciStatus=="success"){
                          console.log('✓', action, file,'(format was modifed)');
                          process.env[status] = "TRUE"
                          console.log(result)
                        } else {
                          console.warn('➜', 'You are changing the version of an unused dependency.')
                          process.env[status] = "FALSE"
                          console.log(result)
                        }
                  
                      });

                  })



                } else {
                  process.env[status] = "FALSE"
                  console.log(result)
                }


              })

    

            })

          })
        })




      });   
      
      

    } ); 


}

module.exports.on = on;
module.exports.off = off;
module.exports.run = run;
module.exports.runRemote = runRemote