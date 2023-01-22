import { readFileSync } from 'fs'
import { toJson } from 'xml2json'
import { stripNamespaceFromString } from './utility.js'
import { WsdlDocument } from '../model/wsdlDocument.js'

const locateNamespaces = (wsdlJsonRepresentation : any) => {
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

const locateTopLevelElement = (wsdlJsonRepresentation : any, elementName : string) => {
    const rootLevelProperty = Object.keys(wsdlJsonRepresentation)[0]
    const definitions = wsdlJsonRepresentation[rootLevelProperty]
    if(definitions[elementName]) {
        //console.log(`found the top level element, it's just ${elementName}`)
        return definitions[elementName]
    }
    else {
        for(let index in global.WSDL_DOCUMENT.namespaces) {
            let ns = global.WSDL_DOCUMENT.namespaces[index]
            if(definitions[`${ns}:${elementName}`]) {
                //console.log(`found the top level element, it's ${ns}:${elementName}`)
                return definitions[`${ns}:${elementName}`]
            }
        }
    }
    //console.warn(`Could not find ${elementName} in the root object!`)
}

export const locateElementWithinParent = (parent : any, elementName : string) => {
    if(parent[elementName]) {
        //console.log(`element ${elementName} found as plain '${elementName}'`)
        return parent[elementName]
    }
    else {
        for(let index in global.WSDL_DOCUMENT.namespaces) {
            let ns = global.WSDL_DOCUMENT.namespaces[index]
            if(parent[`${ns}:${elementName}`]) {
                //console.log(`element ${elementName} found as namespaced i.e. 'ns:${elementName}'`)
                return parent[`${ns}:${elementName}`]
            }
        }
    }
    //console.warn(`Could not find ${elementName} in given parent object!`)
};

export const getMatchingComplexTypeByName = (typeName : string) => {
    return global.WSDL_DOCUMENT.complexTypesInSchema
        .find(ct => stripNamespaceFromString(ct.name) === stripNamespaceFromString(typeName))
}

export const getMatchingSimpleTypeByName = (typeName : string) => {
    return global.WSDL_DOCUMENT.simpleTypesInSchema
        .find(ct => stripNamespaceFromString(ct.name) === stripNamespaceFromString(typeName))
}

const getMatchingTypeByName = (typeName : string) => {
    const matchingComplexType = getMatchingComplexTypeByName(typeName)
    return matchingComplexType || getMatchingSimpleTypeByName(typeName)
}


export const readWsdlDocument = async (documentPath : string) : Promise<void> => {
    global.WSDL_DOCUMENT = {
        xml: '',
        json: undefined,
        namespaces: [],
        service: undefined,
        portTypes: [],
        messages: [],
        bindings: [],
        servicePorts: [],
        location: '',
        schema: undefined,
        elementsInSchema: [],
        complexTypesInSchema: [],
        simpleTypesInSchema: []
    }
    global.WSDL_DOCUMENT.xml = readFileSync(documentPath, 'utf8');
    global.WSDL_DOCUMENT.json = JSON.parse(toJson(global.WSDL_DOCUMENT.xml))
    //debug
    //fs.writeFileSync('service.json', JSON.stringify(global.WSDL_DOCUMENT.json, null, 4));
    global.WSDL_DOCUMENT.namespaces = locateNamespaces(global.WSDL_DOCUMENT.json)
    global.WSDL_DOCUMENT.service = locateTopLevelElement(global.WSDL_DOCUMENT.json, "service")
    const bindings = locateTopLevelElement(global.WSDL_DOCUMENT.json, "binding")
    global.WSDL_DOCUMENT.bindings = Array.isArray(bindings) ? bindings : [bindings]
    global.WSDL_DOCUMENT.portTypes = locateTopLevelElement(global.WSDL_DOCUMENT.json, "portType")
    const messages = locateTopLevelElement(global.WSDL_DOCUMENT.json, "message")
    global.WSDL_DOCUMENT.messages = Array.isArray(messages) ? messages : [messages]

    const servicePorts = locateElementWithinParent(global.WSDL_DOCUMENT.service, "port")
    global.WSDL_DOCUMENT.servicePorts = Array.isArray(servicePorts) ? servicePorts : [servicePorts]
    global.WSDL_DOCUMENT.location = locateElementWithinParent(Array.isArray(global.WSDL_DOCUMENT.servicePorts) ? global.WSDL_DOCUMENT.servicePorts[0] : global.WSDL_DOCUMENT.servicePorts, "address").location.replace(/(https?:\/\/(.*?)\/)(.*)/,'/$3')
    global.WSDL_DOCUMENT.schema = locateElementWithinParent(locateTopLevelElement(global.WSDL_DOCUMENT.json, "types"), "schema")
    global.WSDL_DOCUMENT.elementsInSchema = locateElementWithinParent(global.WSDL_DOCUMENT.schema, "element") || []
    global.WSDL_DOCUMENT.complexTypesInSchema = locateElementWithinParent(global.WSDL_DOCUMENT.schema, "complexType") || []
    global.WSDL_DOCUMENT.simpleTypesInSchema = locateElementWithinParent(global.WSDL_DOCUMENT.schema, "simpleType") || []

    Object.freeze(global.WSDL_DOCUMENT)
}