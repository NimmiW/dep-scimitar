# Dep-sCImitar

![alt text](scimitar.png)

Dep-sCImitar is a prototype tool to cut down the CI waste induced by unused NPM dependencies. 
It can skip CI builds that are invoked by version updates to unused-dependencies. 

## Dep-sCImitar - configuration in CI pipeline. 

This tool could be integrated with any CI provider, such as GitHub Actions, Travis CI, and CircleCI.

```
- name: Check For Unused-Dependency Commits
    run: |
        npm install dep-scimitar # Install the tool
        unusedDepChange=$(npx dep-scimitar runremote)  # Run the tool
        echo "UnusedDepCommit=$unusedDepCommit" >> $GITHUB_ENV  # Env variable 
  
- name: Project-specific Steps
    if:  ${{ env.UnusedDepCommit == 0 }} # Check the env variable 
    run: |
        # project-specific steps
```

## Dep-sCImitar - local (and optional) configuration for developers

To install Dep-sCImitar locally please execute the following npm command. 

```
npm install -g dep-scimitar
```

To turn on Dep-sCImitar for a project, you have to turn it on. To do so, please navigate to the root directory and execute the following command in the commandline. 
Once Dep-sCImitar is turned on, whenever you commit a change, it will add `[ci skip]` label if the change is an unused dependency commit.


```
npx dep-scimitar on
```


To turn off Dep-sCImitar for a certain project, run the following command in the root directory of the project.

```
npx dep-scimitar off
```