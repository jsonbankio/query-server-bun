import {env} from "./env";
import {jsb_queryObject} from "./functions";

/**
 * Starts The Server
 * @constructor
 */
async function main() {
    // log ENV
    console.log(`Environment: ${env.NODE_ENV}`);

    // @ts-ignore
    Bun.serve({
        async fetch(req: Request) {
            let isValidRequest = req.method == 'POST';
            let url: URL | null = null;

            // req.

            try {
                // parse the url
                url = new URL(req.url || '', `https://${req.headers.get('host')}`);

                if (!["/query", "/"].includes(url.pathname)) {
                    isValidRequest = false;
                }
            } catch (e) {
                isValidRequest = false;
            }


            if (isValidRequest && url) {
                // if jsb query does not exist return error
                if (!url.searchParams.has('query')) {
                    return sendJson({
                        error: {code: 'missingQuery', message: 'Missing jsb query'}
                    }, 400);
                }


                // get content from body
                let body: Record<string, any> = {};

                try {
                    body = await req.json();
                    if (!body) {
                        return sendJson({
                            error: {code: 'missingBody', message: 'Missing body with content'}
                        }, 400);
                    }
                } catch (e) {
                    return sendJson({
                        error: {code: 'missingBody', message: 'Missing body with content'}
                    }, 400);
                }



                let content = body.content;

                // check if body has content
                if (!content) {
                    return sendJson({error: {code: 'missingContent', message: 'Missing content'}}, 400);
                }


                // check if content is string
                if (typeof content !== 'string') {
                    // check if content is object
                    if (typeof content !== 'object') {
                        return sendJson({error: {code: 'invalidContent', message: 'Invalid content'}}, 400);
                    }

                    // if content is object, try to stringify it
                    try {
                        content = JSON.stringify(content);
                    } catch (e) {
                        return sendJson({error: {code: 'invalidContent', message: 'Invalid content'}}, 400);
                    }
                }


                return jsb_queryObject(content, url, (data, status) =>
                    sendJson(data, status));
            } else {
                return sendJson({
                    endpoint: 'https://query.jsonbank.io',
                    message: 'Only POST requests are allowed.',
                }, 400);
            }
        },
        port: env.JSB_QUERY_SERVER_PORT,
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