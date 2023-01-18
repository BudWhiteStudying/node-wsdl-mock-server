


/**
 * @deprecated I'm not sure we should be stripping namespaces at all
 */
const stripNamespaceFromString = (candidate) => {
    const splitCandidate = candidate.split(":")
    return splitCandidate[splitCandidate.length-1]
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


const generateRandomResponseTime = (averageResponseTime, responseTimePercentageVariation) => {
    const responseTime = averageResponseTime * (1 - responseTimePercentageVariation) + Math.random() * 2 * responseTimePercentageVariation * averageResponseTime
    console.log(`Responding in ${Math.round(responseTime)} ms`)
    return responseTime
}

const buildIndentation = (recursionRank) => {
    const LOG_TAB_CHARACTER = "   "
    indentation = ""
    while(recursionRank-- > 0) {
        indentation+=LOG_TAB_CHARACTER
    }
    return indentation
}

module.exports = {
    stripNamespaceFromString : stripNamespaceFromString,
    delay : delay,
    generateRandomResponseTime : generateRandomResponseTime,
    buildIndentation : buildIndentation
}