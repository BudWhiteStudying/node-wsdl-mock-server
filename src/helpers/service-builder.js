const utility = require('./utility')
const wsdlReader = require('./wsdl-reader')
const mockResponseBuilder = require('./mock-response-builder')

const processOperation = (operation, operationDefinitions, port, dynamicService) => {
    let outputTypeName = 
        wsdlReader.locateElementWithinParent(
            operationDefinitions
                .find((opDefinition => opDefinition.name === operation.name)),
            "output").message
    let matchingMessage = 
        WSDL_DOCUMENT.messages.find(m => utility.stripNamespaceFromString(m.name) === utility.stripNamespaceFromString(outputTypeName))
    let matchingElement = wsdlReader.locateElementWithinParent(matchingMessage, "part").element
    let outputTypeMessageName = 
        WSDL_DOCUMENT.typeElements.find(t => utility.stripNamespaceFromString(t.name) === utility.stripNamespaceFromString(matchingElement)).name
    let outputType = wsdlReader.getMatchingTypeByName(outputTypeMessageName)
    //console.log(`Adding operation ${operation.name} with outputType:\n${JSON.stringify(outputComplexType, null, 4)}`)
    let mockupResponse = mockResponseBuilder.processComplexType(outputType, 0)
    //console.log(`${JSON.stringify(mockupResponse, null, 4)}`)
    dynamicService[WSDL_DOCUMENT.service.name][port.name][operation.name] = async () => {
        console.log(`Hello from operation ${operation.name}`);
        await utility.delay(utility.generateRandomResponseTime(APP_ENV.averageResponseTime, APP_ENV.responseTimePercentageVariation))
        return mockupResponse;
    }

}

const processBinding = (binding, operationDefinitions, port, dynamicService) => {
    let operations = wsdlReader.locateElementWithinParent(binding, "operation")
    if(!Array.isArray(operations)) {
        operations = [operations]
    }
    dynamicService[WSDL_DOCUMENT.service.name][port.name] = {}
    for(let kindex in operations) {
        processOperation(operations[kindex], operationDefinitions, port, dynamicService)
    }
}

const processPort = (port, operationDefinitions, dynamicService) => {
    let relevantBindings = WSDL_DOCUMENT.bindings.filter(binding => port.binding.endsWith(binding.name))
    for(let jndex in relevantBindings) {
        processBinding(relevantBindings[jndex], operationDefinitions, port, dynamicService)
    }
}

const buildDynamicService = () => {
    const dynamicService = {};
    dynamicService[WSDL_DOCUMENT.service.name] = {}
    const operationDefinitions = wsdlReader.locateElementWithinParent(WSDL_DOCUMENT.portTypes, "operation")
    for(let index in WSDL_DOCUMENT.ports) {
        processPort(WSDL_DOCUMENT.ports[index], Array.isArray(operationDefinitions) ? operationDefinitions : [operationDefinitions], dynamicService)
    }

    return dynamicService;
};

module.exports = {
    buildDynamicService : buildDynamicService
}