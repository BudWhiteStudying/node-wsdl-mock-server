const fs = require('fs')
const parser = require('xml2json')

const utility = require('./utility')

const locateNamespaces = (wsdlJsonRepresentation) => {
    const rootLevelProperty = Object.keys(wsdlJsonRepresentation)[0]
    const definitions = wsdlJsonRepresentation[rootLevelProperty]
    const namespaces = []
    for(let key in definitions) {
        if(key.startsWith("xmlns") && key.split(":").length>1) {
            namespaces.push(key.split(":")[1])
        }
    }
    return namespaces;
}

const locateTopLevelElement = (wsdlJsonRepresentation, elementName) => {
    const rootLevelProperty = Object.keys(wsdlJsonRepresentation)[0]
    const definitions = wsdlJsonRepresentation[rootLevelProperty]
    if(definitions[elementName]) {
        //console.log(`found the top level element, it's just ${elementName}`)
        return definitions[elementName]
    }
    else {
        for(let index in WSDL_DOCUMENT.namespaces) {
            let ns = WSDL_DOCUMENT.namespaces[index]
            if(definitions[`${ns}:${elementName}`]) {
                //console.log(`found the top level element, it's ${ns}:${elementName}`)
                return definitions[`${ns}:${elementName}`]
            }
        }
    }
    //console.warn(`Could not find ${elementName} in the root object!`)
}

const locateElementWithinParent = (parent, elementName) => {
    if(parent[elementName]) {
        //console.log(`element ${elementName} found as plain '${elementName}'`)
        return parent[elementName]
    }
    else {
        for(let index in WSDL_DOCUMENT.namespaces) {
            let ns = WSDL_DOCUMENT.namespaces[index]
            if(parent[`${ns}:${elementName}`]) {
                //console.log(`element ${elementName} found as namespaced i.e. 'ns:${elementName}'`)
                return parent[`${ns}:${elementName}`]
            }
        }
    }
    //console.warn(`Could not find ${elementName} in given parent object!`)
};

const getMatchingComplexTypeByName = (typeName) => {
    return WSDL_DOCUMENT.complexTypesInSchema
        .find(ct => utility.stripNamespaceFromString(ct.name) === utility.stripNamespaceFromString(typeName))
}

const getMatchingSimpleTypeByName = (typeName) => {
    return WSDL_DOCUMENT.simpleTypesInSchema
        .find(ct => utility.stripNamespaceFromString(ct.name) === utility.stripNamespaceFromString(typeName))
}

const getMatchingTypeByName = (typeName) => {
    const matchingComplexType = getMatchingComplexTypeByName(typeName)
    return matchingComplexType || getMatchingSimpleTypeByName(typeName)
}


const readWsdlDocument = async (documentPath) => {
    WSDL_DOCUMENT = {}
    WSDL_DOCUMENT.xml = fs.readFileSync(documentPath, 'utf8');
    WSDL_DOCUMENT.json = JSON.parse(parser.toJson(WSDL_DOCUMENT.xml))
    //debug
    //fs.writeFileSync('service.json', JSON.stringify(WSDL_DOCUMENT.json, null, 4));
    WSDL_DOCUMENT.namespaces = locateNamespaces(WSDL_DOCUMENT.json)
    WSDL_DOCUMENT.service = locateTopLevelElement(WSDL_DOCUMENT.json, "service")
    const bindings = locateTopLevelElement(WSDL_DOCUMENT.json, "binding")
    WSDL_DOCUMENT.bindings = Array.isArray(bindings) ? bindings : [bindings]
    WSDL_DOCUMENT.portTypes = locateTopLevelElement(WSDL_DOCUMENT.json, "portType")
    const messages = locateTopLevelElement(WSDL_DOCUMENT.json, "message")
    WSDL_DOCUMENT.messages = Array.isArray(messages) ? messages : [messages]

    const servicePorts = locateElementWithinParent(WSDL_DOCUMENT.service, "port")
    WSDL_DOCUMENT.servicePorts = Array.isArray(servicePorts) ? servicePorts : [servicePorts]
    WSDL_DOCUMENT.location = locateElementWithinParent(Array.isArray(WSDL_DOCUMENT.servicePorts) ? WSDL_DOCUMENT.servicePorts[0] : WSDL_DOCUMENT.servicePorts, "address").location.replace(/(https?:\/\/(.*?)\/)(.*)/,'/$3')
    WSDL_DOCUMENT.schema = locateElementWithinParent(locateTopLevelElement(WSDL_DOCUMENT.json, "types"), "schema")
    WSDL_DOCUMENT.elementsInSchema = locateElementWithinParent(WSDL_DOCUMENT.schema, "element") || []
    WSDL_DOCUMENT.complexTypesInSchema = locateElementWithinParent(WSDL_DOCUMENT.schema, "complexType") || []
    WSDL_DOCUMENT.simpleTypesInSchema = locateElementWithinParent(WSDL_DOCUMENT.schema, "simpleType") || []

    Object.freeze(WSDL_DOCUMENT)
    return WSDL_DOCUMENT
}

module.exports = {
    locateElementWithinParent : locateElementWithinParent,
    getMatchingSimpleTypeByName : getMatchingSimpleTypeByName,
    getMatchingComplexTypeByName : getMatchingComplexTypeByName,
    readWsdlDocument : readWsdlDocument
}