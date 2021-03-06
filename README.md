# Mark Services
A collection of projects powering the Mark social media platform.

## Features
- Gulp
- Typescript
- Azure Ready
- Opinionated TsLint
- Yarn

## Getting Started
This project acts as the bridge between the client and the data-persistence layers, granting authorization to access the data-persistance layer via the client. 
API Documents: https://mark-services-docs.azurewebsites.net/

### Build Application
`gulp build`

**continuous build**
`gulp watch`

### Run Application
`gulp debug --project {project-name}` e.g. `gulp debug --project ms`

### More information 
More information on the framework this project was built from can be found here: https://github.com/ferrantejake/ts-node-api-shell

## Publishing Project to Azure
Pushing to the Github repo will publish the services project https://mark-services.azurewebsites.net.

## Thank You 
Thank you to Droplit (https://droplit.io) for allowing us to use their build toolchain prior to public release. It is significant for our project's infrastructure as we now have the ability to share code across services with ease.
