
const readAppEnv = (wsdlPathFromCl) => {
    APP_ENV = {}
    APP_ENV.averageResponseTime = process.env.AVG_RESPONSE_TIME_MS || 1500
    APP_ENV.responseTimePercentageVariation = process.env.RESPONSE_TIME_PERC_VARIATION || 0.15
    if (APP_ENV.responseTimePercentageVariation < 0 || APP_ENV.responseTimePercentageVariation > 1) {
        throw "Illegal value for process.env.AVG_RESPONSE_TIME_MS (must be between 0 and 1)"
    }
    APP_ENV.serverPort = process.env.SERVER_PORT || 8001
    APP_ENV.wsdlFilepath = wsdlPathFromCl || process.env.WSDL_FILEPATH || 'wsdl/example.wsdl'
    APP_ENV.messageSizeLimit = process.env.MESSAGE_SIZE_LIMIT || '5mb'
    Object.freeze(APP_ENV)
    console.log(`Script initialized, dumping ENV:\n${JSON.stringify(APP_ENV, null, 4)}`)
    return APP_ENV;
}

module.exports = {
    readAppEnv : readAppEnv
}