import _ from "lodash";
import {env} from "./env";


/**
 * Add Lodash Mixins
 */
_.mixin({
    /**
     * Pick from array of objects
     * @param obj
     * @param keys
     */
    mapPick: (obj: any, ...keys: string[]) => {
        if (Array.isArray(keys[0])) keys = keys[0];

        return _.map(obj, (value) => {
            return _.pick(value, keys);
        });
    },

    /**
     * Omits from array of objects
     * @param obj
     * @param keys
     */
    mapOmit: (obj: any, ...keys: string[]) => {
        if (Array.isArray(keys[0])) keys = keys[0];

        return _.map(obj, (value) => {
            return _.omit(value, keys);
        });
    }
});

/**
 * Decode base64 Json string
 * @param str
 */
function base64JsonDecode(str: string) {
    return JSON.parse(atob(str));
}


/**
 * Get size of a string
 * @param str
 */
 function jsb_stringSize(str: string) {
    return (new TextEncoder().encode(str)).length
}


/**
 * Check for variables in a query object
 * @param url
 * @param args
 */
export function jsb_checkForVariables(
    url: URL,
    args: string[]
) {
    for (const i in args) {
        let arg = String(args[i]).trim();
        // Can't be a var( if not upto 4
        if (arg.length < 4) continue;

        const isVar = arg.indexOf("var(") === 0;
        const isRaw = arg.indexOf("raw(") === 0;
        const isJson = arg.indexOf("json(") === 0;

        // if not var( && raw( continue
        if (!isRaw && !isVar && !isJson) continue;

        // get the keyword
        const key = arg.slice(isJson ? 5 : 4, -1);
        let value: string | string[] | null = url.searchParams.get(key);

        if (value) {
            // If value has comma, split
            if (!isRaw && !isJson && value && value.indexOf(",") > 0) {
                value = value.split(",");
            }

            if (isJson) {
                if (value.indexOf("b64(") === 0) {
                    const encodedValue = (value as string).substr(
                        4,
                        value.length - 5
                    );

                    try {
                        value = base64JsonDecode(encodedValue) as any;
                    } catch {
                        throw new Error(
                            `Value for query json(${key}) is not a valid b64 json string`
                        );
                    }
                } else {
                    try {
                        value = JSON.parse(value as string);
                    } catch (e) {
                        throw new Error(
                            `Value for query json(${key}) is not a valid json string`
                        );
                    }
                }
            }
        }

        args[i] = value as any;
    }
    return args;
}

type Respond = (error: { error: { code: string, message: string } }, status: number) => any | ((obj: string) => any)

/**
 * Parse the jsonbank query string.
 * @param content
 * @param url
 * @param respond
 */
export function jsb_queryObject(content: string, url: URL, respond: Respond) {
    // get content size
    const contentSize = jsb_stringSize(content);
    // stop if content size is greater than 2MB
    if (contentSize > env.JSB_QUERY_SERVER_MAX_CONTENT_SIZE * 1024 * 1024) {
        return respond(
            {
                error: {
                    code: "contentSizeExceeded",
                    message: `Content size exceeded 2MB`
                }
            },
            400
        );
    }

    let parsed: any = {};


    // Get all Queries
    // const allQueries = http.$query.all();
    // Get main query.
    const query = url.searchParams.get("query");

    // If main query exists and has a queryable value.
    if (query && query.length) {

        try {
            parsed = JSON.parse(content);
        } catch (err) {
            return respond({error: {code: "invalidJson", message: "Invalid json string"}}, 400);
        }


        // Split queries
        // E.g ?query=nth-3,omit-username
        // ['nth-3', 'omit-username']
        const queries = query.split(",");

        // Loop Through Queries
        for (const q of queries) {
            // skip if query is empty
            if (!q.length) continue;

            // spit args
            // Eg pick-id-username
            // ['pick', 'id', 'username']
            let [fn, ...args] = q.split("-");

            // Check lodash function called is allowed.
            if (!allowedLodashFunctions.includes(fn)) {
                // return error.
                return respond(
                    {error: {code: "invalidQuery", message: `Invalid query: ${q}`}},
                    400
                );
            }

            // Try Checking for variables e.g pick-var(only)
            // var(), raw() && json()
            try {
                args = jsb_checkForVariables(url, args);

                // Run Query.
                const result = (_ as any)[fn](parsed, ...args);

                if (result === undefined)
                    return respond(
                        {error: {code: "resultUndefined", message: `Query: {${fn}} returned undefined!`}},
                        500
                    );

                if (typeof result === "object") {
                    parsed = result;
                } else {
                    parsed = {$value: result};
                }
            } catch (e: any) {
                return respond({error: {code: "badQuery", message: e.message}}, 400);
            }
        }
    }

    return respond(parsed, 200);
}

const allowedLodashFunctions = [
    // Array
    "chunk",
    "first",
    "last",
    "nth",
    "reverse",
    "slice",
    "take",
    "takeRight",
    "mapPick",
    "mapOmit",

    // Obj
    "get",
    "at",
    "has",
    "hasIn",
    "keys",
    "values",
    "valuesIn",
    "keysIn",
    "omit",
    "unset",
    "pick",

    // lang
    "castArray",
    "isArray",

    // Collection
    "find",
    "findLast",
    "filter",
    "size",
    "every",
    "orderBy",
    "sortBy",
    "reject",
    "shuffle",
    "map",

    // math
    "max",
    "min",
    "sum"
];
