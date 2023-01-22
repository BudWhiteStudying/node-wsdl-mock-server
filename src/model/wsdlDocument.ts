export interface WsdlDocument {
    xml : string,
    json : any,
    namespaces : string[],
    service : any,
    portTypes : any[],
    messages : any[],
    bindings : any[],
    servicePorts : any[],
    location : string,
    schema : any,
    elementsInSchema : any[],
    complexTypesInSchema : any[],
    simpleTypesInSchema : any[]
}