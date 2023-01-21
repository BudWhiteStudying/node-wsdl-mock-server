const utility = require('./utility')
const wsdlReader = require('./wsdl-reader')
const mockResponseBuilder = require('./mock-response-builder')
const constants = require('./constants')

const processNonPrimitiveType = (element) => {
    if (element["complexType"]) {
        console.debug(`The element contains its own complexType`)
        return mockResponseBuilder.processComplexType(element["complexType"])
    }
    else if(element["simpleType"]) {
        console.debug(`The element contains its own simpleType`)
        return mockResponseBuilder.processSimpleType(element["simpleType"])
    }
    else {
        console.debug(`The element does not contain its own complexType or simpleType, need to look for a match within simpleTypes or complexTypes for its name ${element.type}`)
        const maybeMatchingComplexType = WSDL_DOCUMENT.complexTypesInSchema
            .find(ct => utility.stripNamespaceFromString(ct.name) === utility.stripNamespaceFromString(element.type));
        const maybeMatchingSimpleType = WSDL_DOCUMENT.simpleTypesInSchema
            .find(st => utility.stripNamespaceFromString(st.name) === utility.stripNamespaceFromString(element.type));
        if(maybeMatchingComplexType) {
            return mockResponseBuilder.processComplexType(maybeMatchingComplexType)
        }
        else if(maybeMatchingSimpleType) {
            return mockResponseBuilder.processSimpleType(maybeMatchingSimpleType)
        }
    }

}

const processOperationImplementation = (opImplementation, operationDefinitions, port, dynamicService) => {
    let mockupResponse = undefined
    const outputMessageName =
        wsdlReader.locateElementWithinParent(
            operationDefinitions
                .find((opDefinition => opDefinition.name === opImplementation.name)),
            "output").message
    const matchingMessage =
        WSDL_DOCUMENT.messages.find(m => utility.stripNamespaceFromString(m.name) === utility.stripNamespaceFromString(outputMessageName))
    const nameOfMatchingElement = wsdlReader.locateElementWithinParent(matchingMessage, "part").element
    // the element is going to be in the types section
    // either as an element with a 'type' attribute referencing a complexType
    // or as an element complete with their complexType definition
    const matchingElement =
        WSDL_DOCUMENT.elementsInSchema
            .find(t => utility.stripNamespaceFromString(t.name) === utility.stripNamespaceFromString(nameOfMatchingElement))
    //TODO: this outputType could be a simple type, need to account for that
    if (constants.XSD_PRIMITIVE_TYPES.includes(utility.stripNamespaceFromString(matchingElement.name))) {
        console.warn(`Retrieved matchingTypeName of primitive type ${matchingElement.name}, the script will probably bug out, assuming it's a complex type defined somewhere`)
        mockupResponse = mockResponseBuilder.generateMockValueIfPrimitiveType(utility.stripNamespaceFromString(matchingElement.name))
    }
    else {
        //TODO: in case of simpleTypes with restrictions, I need to take their restrictions into account when I produce the mockup
        //TODO: I also need to account for attributes...
        mockupResponse = processNonPrimitiveType(matchingElement)
    }
    //console.log(`${JSON.stringify(mockupResponse, null, 4)}`)
    dynamicService[WSDL_DOCUMENT.service.name][port.name][opImplementation.name] = async () => {
        console.log(`Hello from operation ${opImplementation.name}`);
        await utility.delay(utility.generateRandomResponseTime(APP_ENV.averageResponseTime, APP_ENV.responseTimePercentageVariation))
        return mockupResponse;
    }

}

const processBinding = (binding, operationDefinitions, port, dynamicService) => {
    let operationImplementations = wsdlReader.locateElementWithinParent(binding, "operation")
    if (!Array.isArray(operationImplementations)) {
        operationImplementations = [operationImplementations]
    }
    dynamicService[WSDL_DOCUMENT.service.name][port.name] = {}
    for (let index in operationImplementations) {
        processOperationImplementation(operationImplementations[index], operationDefinitions, port, dynamicService)
    }
}

const processPort = (port, operationDefinitions, dynamicService) => {
    let relevantBindings = WSDL_DOCUMENT.bindings.filter(binding => port.binding.endsWith(binding.name))
    for (let index in relevantBindings) {
        processBinding(relevantBindings[index], operationDefinitions, port, dynamicService)
    }
}

const buildDynamicService = () => {
    const dynamicService = {};
    dynamicService[WSDL_DOCUMENT.service.name] = {}
    const operationDefinitions = wsdlReader.locateElementWithinParent(WSDL_DOCUMENT.portTypes, "operation")
    for (let index in WSDL_DOCUMENT.servicePorts) {
        processPort(WSDL_DOCUMENT.servicePorts[index], Array.isArray(operationDefinitions) ? operationDefinitions : [operationDefinitions], dynamicService)
    }

    return dynamicService;
};

module.exports = {
    buildDynamicService: buildDynamicService
}