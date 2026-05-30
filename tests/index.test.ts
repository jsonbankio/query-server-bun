import {expect, test, describe} from "bun:test";
import {jsb_checkForVariables, jsb_queryObject, RespondError} from "../functions";
import Countries from "./countries.json";

const HOST = "http://localhost:2224";
const countriesData = JSON.stringify(Countries);
const countries = JSON.stringify(Countries.countries);
const numbers = JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);


test("Check for variables", () => {
    let data = jsb_checkForVariables(new URL(
            `${HOST}/?foo=bar&a=b&0=1`),
        [
            "var(foo)",
            "var(a)",
            "var(notExists)",
            "var(0)",
        ]
    );
    expect(data).toBeDefined();
    expect(data).toEqual(["bar", "b", null, "1"]);
});

test("Check for raw variables", () => {
    let data = jsb_checkForVariables(new URL(
            `${HOST}/?foo=bar&a=b&0=1`),
        [
            "raw(foo)",
            "raw(a)",
            "raw(notExists)",
            "raw(0)",
        ]
    );
    expect(data).toBeDefined();
    expect(data).toEqual(["bar", "b", null, "1"]);
});

test("Check for json variables", () => {
    let data = jsb_checkForVariables(new URL(
            `${HOST}/?data=[1,2,3]`),
        [
            "raw(data)",
            "json(data)",
        ]
    );
    expect(data).toBeDefined();
    expect(data).toEqual(["[1,2,3]", [1, 2, 3]]);
})

test("Check for json base64 variables", () => {
    let b64Data = btoa(JSON.stringify(["a", "b", "c"]));
    let data = jsb_checkForVariables(new URL(
            `${HOST}/?data=b64(${b64Data})`),
        [
            "json(data)",
        ]
    );
    expect(data).toBeDefined();
    expect(data).toEqual([["a", "b", "c"]]);
})


describe("Object Filters", () => {

    test("get", () => {
        let url = new URL(`${HOST}/?query=get-countries`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual(Countries.countries)
        })

        url = new URL(`${HOST}/?query=get-nothere`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(400);
            const err = data as RespondError;
            expect(err.error.code).toEqual("badQuery");
        })
    })

    test("at", () => {
        let url = new URL(`${HOST}/?query=at-raw(at)&at=countries[4].name`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual(["Australia"])
        })

        url = new URL(`${HOST}/?query=at-json(at)&at=${JSON.stringify([
            "countries[0].name",
            "countries[4].name"
        ])}`);


        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual(["Afghanistan", "Australia"])
        })
    })


    test("has", () => {
        let url = new URL(`${HOST}/?query=has-countries[0].name`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual({$value: true})
        })

        url = new URL(`${HOST}/?query=has-countries[0].nothere`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual({$value: false})
        })
    })

    test("keys", () => {
        let url = new URL(`${HOST}/?query=keys`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual(["countries"])
        })

        // First proof of chained filters.
        url = new URL(`${HOST}/?query=get-countries[0],keys`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual(["name", "code", "capital", "region", "population", "currency"])
        })
    })

    test("values", () => {
        let url = new URL(`${HOST}/?query=get-countries[0],values`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual([
                "Afghanistan",
                "AF",
                "Kabul",
                "Asia",
                38928346,
                "AFN"
            ])
        })
    })

    test("omit", () => {
        let url = new URL(`${HOST}/?query=get-countries[0],omit-code-population`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual({
                name: "Afghanistan",
                capital: "Kabul",
                region: "Asia",
                currency: "AFN"
            })
        })
    })


    test("pick", () => {
        let url = new URL(`${HOST}/?query=get-countries[0],pick-name-capital`);
        jsb_queryObject<any>(countriesData, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual({
                name: "Afghanistan",
                capital: "Kabul"
            })
        })
    })
})


describe("Array Filters", () => {
    test("chunk", () => {
        let url = new URL(`${HOST}/?query=chunk-3`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]])
        })
    })

    test("first", () => {
        let url = new URL(`${HOST}/?query=first`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual({$value: 1})
        })
    })

    test("last", () => {
        let url = new URL(`${HOST}/?query=last`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual({$value: 10})
        })
    })

    test("nth", () => {
        let url = new URL(`${HOST}/?query=nth-3`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual({$value: 4})
        })
    })

    test("reverse", () => {
        let url = new URL(`${HOST}/?query=reverse`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
        })
    })

    test("slice", () => {
        let url = new URL(`${HOST}/?query=slice-2-5`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual([3, 4, 5])
        })
    })

    test("take", () => {
        let url = new URL(`${HOST}/?query=take-3`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual([1, 2, 3])
        })
    })

    test("takeRight", () => {
        let url = new URL(`${HOST}/?query=takeRight-3`);
        jsb_queryObject<any>(numbers, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data).toEqual([8, 9, 10])
        })
    })

    test("mapPick", () => {
        let url = new URL(`${HOST}/?query=mapPick-name-code`);
        jsb_queryObject<any>(countries, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data[0]).toEqual({
                name: "Afghanistan",
                code: "AF",
            })
        })
    })

    test("mapOmit", () => {
        let url = new URL(`${HOST}/?query=mapOmit-name-code`);
        jsb_queryObject<any>(countries, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(200);
            expect(data[0].name).toBeUndefined()
            expect(data[0].code).toBeUndefined()
            expect(data[0].capital).toBeDefined()
        })
    })

})