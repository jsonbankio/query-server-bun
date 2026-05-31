import {env} from "./env";
import {jsb_queryObject, MAX_CONTENT_SIZE} from "./functions";

/**
 * Handles a POST query request.
 * Reads the body once and hands the parsed content straight to jsb_queryObject.
 */
async function handleQuery(req: Request) {
    // Reject oversized payloads up front via Content-Length, before buffering the body.
    const contentLength = Number(req.headers.get('content-length'));
    if (contentLength > MAX_CONTENT_SIZE) {
        return sendJson({
            error: {code: 'contentSizeExceeded', message: 'Content size exceeded 5MB'}
        }, 413);
    }

    const url = new URL(req.url);

    // if jsb query does not exist return error
    if (!url.searchParams.has('query')) {
        return sendJson({
            error: {code: 'missingQuery', message: 'Missing jsb query'}
        }, 400);
    }

    // get content from body (parsed once)
    let body: Record<string, any>;
    try {
        body = await req.json();
    } catch (e) {
        return sendJson({
            error: {code: 'missingBody', message: 'Missing body with content'}
        }, 400);
    }

    if (!body) {
        return sendJson({
            error: {code: 'missingBody', message: 'Missing body with content'}
        }, 400);
    }

    const content = body.content;

    // check if body has content
    if (!content) {
        return sendJson({error: {code: 'missingContent', message: 'Missing content'}}, 400);
    }

    // content must be a json string or an already-parsed object/array.
    // Parsed JSON is always acyclic, so it can be passed through without re-stringifying.
    if (typeof content !== 'string' && typeof content !== 'object') {
        return sendJson({error: {code: 'invalidContent', message: 'Invalid content'}}, 400);
    }

    return jsb_queryObject<any>(content, url, (data, status) =>
        sendJson(data, status));
}

/**
 * Starts The Server
 * @constructor
 */
async function main() {
    // log ENV
    console.log(`Environment: ${env.NODE_ENV}`);

    Bun.serve({
        routes: {
            "/query": {POST: handleQuery},
            "/": {POST: handleQuery},
        },
        // Fallback for anything the routes above don't match: 405 for a known path
        // with the wrong method, 404 otherwise.
        fetch(req: Request) {
            const {pathname} = new URL(req.url);
            if (pathname === "/query" || pathname === "/") {
                return sendJson({message: 'Only POST requests are allowed.'}, 405);
            }
            return sendJson({error: {code: 'notFound', message: 'Not found'}}, 404);
        },
        port: env.JSB_QUERY_SERVER_PORT,
        // Allow multiple server processes to share the port for horizontal scaling.
        reusePort: true,
    });


    console.log(`${env.APP_NAME} is running on port ${env.JSB_QUERY_SERVER_PORT}`);
    // log link to console
    console.log(`http://localhost:${env.JSB_QUERY_SERVER_PORT}`);
}

// Start Server
main().catch(console.error);


// ================================ Functions ================================

// Send JSON Response
function sendJson(data: string | object, status = 200) {
    data = typeof data === 'string' ? data : JSON.stringify(data);

    return new Response(data, {
        headers: {'Content-Type': 'application/json'},
        status,
    })

}