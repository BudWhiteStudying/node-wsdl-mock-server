


/**
 * @deprecated I'm not sure we should be stripping namespaces at all
 */
export const stripNamespaceFromString = (candidate : string) => {
    const splitCandidate = candidate.split(":")
    return splitCandidate[splitCandidate.length-1]
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


export const generateRandomResponseTime = (averageResponseTime : number, responseTimePercentageVariation : number) => {
    const responseTime = averageResponseTime * (1 - responseTimePercentageVariation) + Math.random() * 2 * responseTimePercentageVariation * averageResponseTime
    console.log(`Responding in ${Math.round(responseTime)} ms`)
    return responseTime
}

export const buildIndentation = (recursionRank : number) => {
    const LOG_TAB_CHARACTER = "   "
    let indentation = ""
    while(recursionRank-- > 0) {
        indentation+=LOG_TAB_CHARACTER
    }
    return indentation
}