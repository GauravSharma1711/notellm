import { flattenError } from "zod";
export function getZodFieldErrors(error) {
    return flattenError(error).fieldErrors;
}
