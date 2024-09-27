import { Provider } from "../../config/config.js"
import { Steps } from "../scraper.js"
import { bodasnetSteps } from "./bodasnet/bodasnet.js"
import { googleSteps } from "./google/google.js"

type ProvidersMap = {
    [P in Provider]: Steps<P>
}
const providers: ProvidersMap = {
    'google': googleSteps,
    'bodasnet': bodasnetSteps,
}
export const getSteps = <T extends Provider>(provider: T): Steps<T> => providers[provider]




