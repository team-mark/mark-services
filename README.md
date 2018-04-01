# mark-services
Powering the ethereum-based social media platform, Mark.

## Getting Started
This project acts as the bridge between the client and the data-persistence layers, granting autorization to access the data-persistance layer via the client. 

API Documents: https://mark-services.azurewebsites.net/api-docs

### Build Application
`gulp build`
**continuous build**
`gulp watch`

### Run Application
`gulp debug` for debugging output and `node index.js` for debug-less runtime.

## Publishing Project to Azure
Pushing to the Github repo will publish the services project `mark-services.azurewebsites.net`.
