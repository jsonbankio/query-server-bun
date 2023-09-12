const autocannon = require("autocannon");


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const config = {
    connections: 100,
    duration: 5,
    pipelining: 10,
    method: "POST",
    body: JSON.stringify({
        "content": "{ \"name\": \"John\",  \"age\": 30,  \"email\": \"john_doe@gmail.com\"}"
    }),
}

const query = `?query=pick-name-email`


/**
 * Benchmark without query
 * @return {Promise<void>}
 * @constructor
 */
async function Benchmark() {
    console.log(`Running NodeJS Benchmark:`)
    const node = await autocannon({
        url: "http://localhost:2224",
        ...config,
    });
    console.log(autocannon.printResult(node))

    // Wait 5 seconds for cool down
    console.log("Waiting 5 seconds...")
    await sleep(5000)

    console.log("Running Bun Benchmark:")
    const bun = await autocannon({
        url: "http://localhost:2225",
        ...config
    })
    console.log(autocannon.printResult(bun))
}


/**
 * Benchmark with query
 */
async function BenchmarkWithQuery() {

    console.log(`Running NodeJS Benchmark with QUERY:`)
    const node = await autocannon({
        url: "http://localhost:2224" + query,
        ...config,
    });
    console.log(autocannon.printResult(node))

    // Wait 5 seconds for cool down
    console.log("Waiting 5 seconds...")
    await sleep(5000)

    console.log("Running Bun Benchmark with QUERY:")
    const bun = await autocannon({
        url: "http://localhost:2225" + query,
        ...config
    })
    console.log(autocannon.printResult(bun))
}

Benchmark().then(() => sleep(5000).then(() => BenchmarkWithQuery()).catch(console.error)).catch(console.error)