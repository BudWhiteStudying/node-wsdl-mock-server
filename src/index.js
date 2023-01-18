//TODO: comply to this https://www.w3schools.com/xml/schema_elements_ref.asp
(async () => {

    const express = require('express')
    const app = express()
    const bodyParser = require('body-parser')
    const soap = require('soap')
    const minimist = require('minimist-lite')

    const wsdlReader = require('./helpers/wsdl-reader')
    const serviceBuilder = require('./helpers/service-builder')
    const envReader = require('./helpers/env-reader');

    // READ CL ARGUMENTS
    const commandLineArgs = minimist((process.argv.slice(2))) 
    console.log(`Command-line arguments:\n${JSON.stringify(commandLineArgs, null, 4)}`)
    const wsdlPathFromCl = commandLineArgs["wsdl"]

    // READ ENV
    const APP_ENV = await envReader.readAppEnv(wsdlPathFromCl)

    // READ WSDL DOCUMENT
    const WSDL_DOCUMENT = await wsdlReader.readWsdlDocument(APP_ENV.wsdlFilepath)

    // DYNAMICALLY BUILD SERVICE
    const dynamicService = serviceBuilder.buildDynamicService()

    // START THE SERVER, EXPOSE THE SERVICE
    app.use(bodyParser.raw({ type: function () { return true; }, limit: APP_ENV.messageSizeLimit }));
    app.listen(APP_ENV.serverPort, function () {
        soap.listen(app, WSDL_DOCUMENT.location, dynamicService, WSDL_DOCUMENT.xml, function () {
            console.log(`Serving ${Object.keys(dynamicService)[0]} from location ${WSDL_DOCUMENT.location}`);
        });
    });
})();