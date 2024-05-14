#!/usr/bin/env node
const setup = require('../setup');
// const fetch = import('node-fetch');  


var option = process.argv[2];

async function run(){
	switch(option){
		case "on": 
			setup.on();
			break;
	
		case "off":
			setup.off();
			break;
	
		case "run":
			// await setup.analyse();
			setup.run().catch(error => {
				console.error("Error:", error);
			});
			break;

		case "runremote":
			// await setup.analyse();
			setup.runRemote().catch(error => {
				console.error("Error:", error);
			});
			break;
		default:
			console.log("Please enter a valid Dep-sCImitar command.");
	}
}



run()





// Example usage


// const gitRemote = "git remote get-url origin"
// var cwd = process.cwd()
// exec(gitRemote, { cwd: cwd }, (error, repoUrl, stderr) => {
// 	console.log(repoUrl)
// 	const parts = repoUrl.split("/");
// 	const owner = parts[3];
// 	const repoName = parts[4].replace(".git", "");
// 	const sha = "102e1766717fc97ac73dd5175174d2e7de686d3f" //TODO
// 	const apiUrl = 'https://api.github.com/repos/'+owner+"/"+repoName+"/commits/"+sha+'/check-runs';
// 	console.log("apiUrl",apiUrl)

// 	fetchAndCalculateStatus(apiUrl)
// 	  .then(ciStatus => {
// 		console.log("ci_status", ciStatus);
// 		// You can use ciStatus in your other functions or processing here
// 	  });

// })




// const axios = require('axios');

// const apiUrl = 'https://api.github.com/repos/dvelasquez/lighthouse-viewer/commits/0216fba4d7fc76da62df93561b15763b348760dd/check-runs';

// function getBuildStatus(ciObjs) {
// 	let statuses = [];
  
// 	try {
// 	  for (const obj of ciObjs) {
// 		statuses.push(obj['conclusion']);
// 	  }
// 	  statuses = statuses.filter(s => s !== "skipped");
	  
// 	  if (statuses.every(status => status === statuses[0])) {
// 		return statuses[0];
// 	  } else {
// 		return "failure";
// 	  }
// 	} catch (error) {
// 	  console.log(error)
// 	  return null;
// 	}
// }
  
  
  
// axios.get(apiUrl)
//   .then(response => {

//     console.log(response.data.check_runs);
// 	ci_status = getBuildStatus(response.data.check_runs)
// 	console.log("ci_status",ci_status)
	
//   })
//   .catch(error => {
//     console.error('Axios error:', error);
//   });



// async function getOverallStatus() {
// 	const apiUrl = 'https://api.github.com/repos/dvelasquez/lighthouse-viewer/commits/0216fba4d7fc76da62df93561b15763b348760dd/check-runs';
	
// 	const response = await fetch(apiUrl, {
// 	  headers: {
// 	  }
// 	});
	
// 	if (response.ok) {
// 	  const data = await response.json();
// 	  console.log(data)
// 	} else {
// 	  console.error(`Error: ${response.status} - ${response.statusText}`);
// 	}
//   }
  
//   async function main() {
// 	const overallStatus = await getOverallStatus();
// 	console.log(`Overall status: ${overallStatus}`);
//   }
  
//   main();
