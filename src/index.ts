//TODO: comply to this https://www.w3schools.com/xml/schema_elements_ref.asp
import express, { json } from "express"
import soap from "soap"
import bodyParser from "body-parser"
import minimist from "minimist-lite"

import { readWsdlDocument } from './helpers/wsdl-reader.js'
import { buildDynamicService } from './helpers/service-builder.js'
import { readAppEnv } from './helpers/env-reader.js'

const app = express();

// READ CL ARGUMENTS
const commandLineArgs = minimist((process.argv.slice(2)))
console.log(`Command-line arguments:\n${JSON.stringify(commandLineArgs, null, 4)}`)
const wsdlPathFromCl = commandLineArgs["wsdl"]

// READ ENV
global.APP_ENV = readAppEnv(wsdlPathFromCl)

// READ WSDL DOCUMENT
await readWsdlDocument(APP_ENV.wsdlFilepath)

// DYNAMICALLY BUILD SERVICE
const dynamicService = buildDynamicService()

// START THE SERVER, EXPOSE THE SERVICE
app.use(bodyParser.raw({ type: function () { return true; }, limit: APP_ENV.messageSizeLimit }));
app.listen(APP_ENV.serverPort, function () {
    soap.listen(app, WSDL_DOCUMENT.location, dynamicService, WSDL_DOCUMENT.xml, function () {
        console.log(`Serving ${Object.keys(dynamicService)[0]} from location ${WSDL_DOCUMENT.location}`);
    });
});