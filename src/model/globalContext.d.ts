import { AppEnvironment } from "./env.js";
import { WsdlDocument } from "./wsdlDocument.js";

export interface global {}
declare global {
    var WSDL_DOCUMENT : WsdlDocument;
    var APP_ENV : AppEnvironment;
}

declare const WSDL_DOCUMENT: WSDL_DOCUMENT;
declare const APP_ENV: APP_ENV;