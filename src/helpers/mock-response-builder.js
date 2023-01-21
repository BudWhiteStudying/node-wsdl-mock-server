const wsdlReader = require('./wsdl-reader')
const utility = require('./utility')


const generateMockValueIfPrimitiveType = (typeName) => {
    switch(typeName) {
        case "int":
            return 0
        case "long":
            return 1000
        case "double":
            return 10.56
        case "string":
            return "pippo"
        case "date":
            return "2014-07-18 10:00:00"
        case "datetime":
            return "2014-07-18 10:00:00"
        case "anyType":
            return "any pippo"
        default:
            return undefined
    }
}

const processType = (typeName, recursionRank) => {
    const strippedType = utility.stripNamespaceFromString(typeName)
    if(generateMockValueIfPrimitiveType(strippedType)!==undefined) {
        //console.log(`${utility.buildIndentation(recursionRank)}The '${elementName}' property is of type '${strippedType}' and will be assigned a mock value of '${generateMockValueIfPrimitiveType(strippedType)}'`)
        return generateMockValueIfPrimitiveType(strippedType)
    }
    else {
        //console.log(`${utility.buildIndentation(recursionRank)}The '${elementName}' property is of type '${strippedType}', which we will need to dig up and process`)
        return processComplexType(wsdlReader.getMatchingComplexTypeByName(strippedType), recursionRank+1)
    }
}

const processComplexType = (complexType, recursionRank) => {
    
    const maybeAll = wsdlReader.locateElementWithinParent(complexType, "all")
    const maybeSequence = wsdlReader.locateElementWithinParent(complexType, "sequence")
    if(maybeAll) {
        //console.log(`${utility.buildIndentation(recursionRank)}The '${elementName}' property is of complex type: all`)
        return buildMockupReturnObject(maybeAll, recursionRank+1)
    }
    else if(maybeSequence) {
        //console.log(`${utility.buildIndentation(recursionRank)}The '${elementName}' property is of complex type: sequence`)
        return buildMockupReturnObject(maybeSequence, recursionRank+1)
    }
    else {
        console.warn(`\n${utility.buildIndentation(recursionRank)}I messed up when looking into the complex type:\n${JSON.stringify(complexType, null, 4)}`)
    }
}

const processSimpleType = (simpleType, recursionRank) => {
    const restriction = wsdlReader.locateElementWithinParent(simpleType, "restriction")
    if(restriction) {
        //console.log(`${utility.buildIndentation(recursionRank)}The '${elementName}' property is of simple type with base type: ${restriction.base}`)
        return processType(restriction.base, recursionRank+1)
    }
    else {
        console.warn(`${utility.buildIndentation(recursionRank)}I messed up when looking into the simple type`)
    }
}

const processTypeElement = (element, recursionRank) => {
    const maybeType = wsdlReader.locateElementWithinParent(element, "type");
    const maybeComplexType = wsdlReader.locateElementWithinParent(element, "complexType");
    const maybeSimpleType = wsdlReader.locateElementWithinParent(element, "simpleType");
    if(maybeType) {
        return processType(maybeType, recursionRank)
    }
    else if(maybeComplexType) {
        return processComplexType(maybeComplexType, recursionRank)
    }
    else if(maybeSimpleType) {
        return processSimpleType(maybeSimpleType, recursionRank)
    }
    else {
        //console.log(`${utility.buildIndentation(recursionRank)}I messed up when looking into the type`)
    }

}

const buildMockupReturnObject = (complexTypeElement, recursionRank) => {
    // assuming I'm handling the root of the object e.g. the "xs:all" object
    const mockupObject = {}
    const elements = wsdlReader.locateElementWithinParent(complexTypeElement, "element")
    if(Array.isArray(elements)) {
        for(const index in elements) {
            let element = elements[index]
            mockupObject[element.name] = processTypeElement(element, recursionRank)
        }
    }
    else {
        mockupObject[elements.name] = processTypeElement(elements, recursionRank)
    }

    return mockupObject
}

module.exports = {
    buildMockupReturnObject : buildMockupReturnObject,
    processComplexType : processComplexType,
    processSimpleType : processSimpleType,
    generateMockValueIfPrimitiveType : generateMockValueIfPrimitiveType
}