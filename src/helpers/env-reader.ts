import { AppEnvironment } from '../model/app-environment.js'

const DEFAULT_APP_ENV : AppEnvironment = {
    averageResponseTime: 1000,
    responseTimePercentageVariation: 0.15,
    serverPort: 8001,
    wsdlFilepath: 'wsdl/example.wsdl',
    messageSizeLimit: '5mb'
}

export const readAppEnv = (wsdlPathFromCl : string) => {
    const APP_ENV : AppEnvironment = DEFAULT_APP_ENV
    if(process.env.AVG_RESPONSE_TIME_MS!==undefined) {
        APP_ENV.averageResponseTime = parseInt(process.env.AVG_RESPONSE_TIME_MS)
    }
    if(process.env.RESPONSE_TIME_PERC_VARIATION!==undefined) {
        APP_ENV.responseTimePercentageVariation = parseFloat(process.env.RESPONSE_TIME_PERC_VARIATION)
    }
    if (APP_ENV.responseTimePercentageVariation < 0 || APP_ENV.responseTimePercentageVariation > 1) {
        //TODO: strengthen this validation
        throw "Illegal value for process.env.AVG_RESPONSE_TIME_MS (must be between 0 and 1)"
    }
    if(process.env.SERVER_PORT!==undefined) {
        APP_ENV.serverPort = parseInt(process.env.SERVER_PORT)
    }
    if (wsdlPathFromCl!==undefined) {
        APP_ENV.wsdlFilepath = wsdlPathFromCl
    }
    else if (process.env.WSDL_FILEPATH!==undefined) {
        APP_ENV.wsdlFilepath = process.env.WSDL_FILEPATH
    }
    else {
        console.warn(`No WSDL path specified, defaulting to ${APP_ENV.wsdlFilepath}`)
    }
    if (process.env.MESSAGE_SIZE_LIMIT!==undefined) {
        APP_ENV.messageSizeLimit = process.env.MESSAGE_SIZE_LIMIT
    }
    Object.freeze(APP_ENV)
    console.log(`Script initialized, dumping ENV:\n${JSON.stringify(APP_ENV, null, 4)}`)
    return APP_ENV;
}