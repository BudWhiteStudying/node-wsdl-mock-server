import { stripNamespaceFromString, delay, generateRandomResponseTime } from './utility.js'
import { locateElementWithinParent } from './wsdl-reader.js'
import { processSimpleType, processComplexType, generateMockValueIfPrimitiveType } from './mock-response-builder.js'
import { XSD_PRIMITIVE_TYPES } from './constants.js'

const processNonPrimitiveType = (element : any, recursionRank : number) => {
    if (element["complexType"]) {
        console.debug(`The element contains its own complexType`)
        return processComplexType(element["complexType"], recursionRank+1)
    }
    else if(element["simpleType"]) {
        console.debug(`The element contains its own simpleType`)
        return processSimpleType(element["simpleType"], recursionRank+1)
    }
    else {
        console.debug(`The element does not contain its own complexType or simpleType, need to look for a match within simpleTypes or complexTypes for its name ${element.type}`)
        const maybeMatchingComplexType = global.WSDL_DOCUMENT.complexTypesInSchema
            .find((ct : any) => stripNamespaceFromString(ct.name) === stripNamespaceFromString(element.type));
        const maybeMatchingSimpleType = global.WSDL_DOCUMENT.simpleTypesInSchema
            .find((st : any) => stripNamespaceFromString(st.name) === stripNamespaceFromString(element.type));
        if(maybeMatchingComplexType) {
            return processComplexType(maybeMatchingComplexType, recursionRank+1)
        }
        else if(maybeMatchingSimpleType) {
            return processSimpleType(maybeMatchingSimpleType, recursionRank+1)
        }
    }

}

const processOperationImplementation = (opImplementation : any, operationDefinitions : any[], port : any, dynamicService : any) => {
    let mockupResponse : any = undefined
    const outputMessageName =
        locateElementWithinParent(
            operationDefinitions
                .find((opDefinition => opDefinition.name === opImplementation.name)),
            "output").message
    const matchingMessage =
        global.WSDL_DOCUMENT.messages.find(m => stripNamespaceFromString(m.name) === stripNamespaceFromString(outputMessageName))
    const nameOfMatchingElement = locateElementWithinParent(matchingMessage, "part").element
    // the element is going to be in the types section
    // either as an element with a 'type' attribute referencing a complexType
    // or as an element complete with their complexType definition
    const matchingElement =
        global.WSDL_DOCUMENT.elementsInSchema
            .find(t => stripNamespaceFromString(t.name) === stripNamespaceFromString(nameOfMatchingElement))
    //TODO: this outputType could be a simple type, need to account for that
    if (XSD_PRIMITIVE_TYPES.includes(stripNamespaceFromString(matchingElement.name))) {
        console.warn(`Retrieved matchingTypeName of primitive type ${matchingElement.name}, the script will probably bug out, assuming it's a complex type defined somewhere`)
        mockupResponse = generateMockValueIfPrimitiveType(stripNamespaceFromString(matchingElement.name))
    }
    else {
        //TODO: in case of simpleTypes with restrictions, I need to take their restrictions into account when I produce the mockup
        //TODO: I also need to account for attributes...
        mockupResponse = processNonPrimitiveType(matchingElement, 0)
    }
    //console.log(`${JSON.stringify(mockupResponse, null, 4)}`)
    dynamicService[global.WSDL_DOCUMENT.service.name][port.name][opImplementation.name] = async () => {
        console.log(`Hello from operation ${opImplementation.name}`);
        await delay(generateRandomResponseTime(APP_ENV.averageResponseTime, APP_ENV.responseTimePercentageVariation))
        return mockupResponse;
    }

}

const processBinding = (binding : any, operationDefinitions : any[], port : any, dynamicService : any) => {
    let operationImplementations = locateElementWithinParent(binding, "operation")
    if (!Array.isArray(operationImplementations)) {
        operationImplementations = [operationImplementations]
    }
    dynamicService[global.WSDL_DOCUMENT.service.name][port.name] = {}
    for (let index in operationImplementations) {
        processOperationImplementation(operationImplementations[index], operationDefinitions, port, dynamicService)
    }
}

const processPort = (port : any, operationDefinitions : any[], dynamicService : any) => {
    let relevantBindings = global.WSDL_DOCUMENT.bindings.filter(binding => port.binding.endsWith(binding.name))
    for (let index in relevantBindings) {
        processBinding(relevantBindings[index], operationDefinitions, port, dynamicService)
    }
}

export const buildDynamicService = () => {
    const dynamicService : any = {};
    dynamicService[global.WSDL_DOCUMENT.service.name] = {}
    const operationDefinitions = locateElementWithinParent(global.WSDL_DOCUMENT.portTypes, "operation")
    for (let index in global.WSDL_DOCUMENT.servicePorts) {
        processPort(global.WSDL_DOCUMENT.servicePorts[index], Array.isArray(operationDefinitions) ? operationDefinitions : [operationDefinitions], dynamicService)
    }

    return dynamicService;
};