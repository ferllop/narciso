import { Steps } from "../scraper.js"
import { bodasnetSteps } from "./bodasnet/bodasnet.js"
import { googleSteps } from "./google/google.js"

export type Provider = 
    | 'google'
    | 'bodasnet'

const providersMap: { [P in Provider]: Steps<P>} = {
    'google': googleSteps,
    'bodasnet': bodasnetSteps,
}

export const getSteps = 
    <T extends Provider>(provider: T): Steps<T> => providersMap[provider]
