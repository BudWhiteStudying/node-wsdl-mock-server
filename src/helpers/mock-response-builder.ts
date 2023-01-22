import { getMatchingComplexTypeByName, locateElementWithinParent } from './wsdl-reader.js'
import { buildIndentation, stripNamespaceFromString } from './utility.js'


export const generateMockValueIfPrimitiveType = (typeName : string) => {
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

const processType = (typeName : string, recursionRank : number) => {
    const strippedType = stripNamespaceFromString(typeName)
    if(generateMockValueIfPrimitiveType(strippedType)!==undefined) {
        //console.log(`${buildIndentation(recursionRank)}The '${elementName}' property is of type '${strippedType}' and will be assigned a mock value of '${generateMockValueIfPrimitiveType(strippedType)}'`)
        return generateMockValueIfPrimitiveType(strippedType)
    }
    else {
        //console.log(`${buildIndentation(recursionRank)}The '${elementName}' property is of type '${strippedType}', which we will need to dig up and process`)
        return processComplexType(getMatchingComplexTypeByName(strippedType), recursionRank+1)
    }
}

export const processComplexType = (complexType : object, recursionRank : number) => {
    
    const maybeAll = locateElementWithinParent(complexType, "all")
    const maybeSequence = locateElementWithinParent(complexType, "sequence")
    if(maybeAll) {
        //console.log(`${buildIndentation(recursionRank)}The '${elementName}' property is of complex type: all`)
        return buildMockupReturnObject(maybeAll, recursionRank+1)
    }
    else if(maybeSequence) {
        //console.log(`${buildIndentation(recursionRank)}The '${elementName}' property is of complex type: sequence`)
        return buildMockupReturnObject(maybeSequence, recursionRank+1)
    }
    else {
        console.warn(`\n${buildIndentation(recursionRank)}I messed up when looking into the complex type:\n${JSON.stringify(complexType, null, 4)}`)
    }
}

export const processSimpleType = (simpleType : object, recursionRank : number) => {
    const restriction = locateElementWithinParent(simpleType, "restriction")
    if(restriction) {
        //console.log(`${buildIndentation(recursionRank)}The '${elementName}' property is of simple type with base type: ${restriction.base}`)
        return processType(restriction.base, recursionRank+1)
    }
    else {
        console.warn(`${buildIndentation(recursionRank)}I messed up when looking into the simple type`)
    }
}

const processTypeElement = (element : object, recursionRank : number) => {
    const maybeType = locateElementWithinParent(element, "type");
    const maybeComplexType = locateElementWithinParent(element, "complexType");
    const maybeSimpleType = locateElementWithinParent(element, "simpleType");
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
        //console.log(`${buildIndentation(recursionRank)}I messed up when looking into the type`)
    }

}

export const buildMockupReturnObject = (complexTypeElement : object, recursionRank : number) => {
    // assuming I'm handling the root of the object e.g. the "xs:all" object
    const mockupObject : any = {}
    const elements = locateElementWithinParent(complexTypeElement, "element")
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