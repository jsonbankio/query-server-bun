import {expect, test, describe} from "bun:test";
import {jsb_checkForVariables, jsb_queryObject, RespondError} from "../functions";
import Countries from "./countries.json";

const HOST = "http://localhost:2224";
const countriesObject = JSON.stringify(Countries);
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
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual(Countries.countries)
        })

        url = new URL(`${HOST}/?query=get-nothere`);
        jsb_queryObject<any>(countriesObject, url, (data, status) => {
            expect(data).toBeDefined();
            expect(status).toEqual(400);
            const err = data as RespondError;
            expect(err.error.code).toEqual("badQuery");
        })
    })

    test("at", () => {
        let url = new URL(`${HOST}/?query=at-raw(at)&at=countries[4].name`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual(["Australia"])
        })

        url = new URL(`${HOST}/?query=at-json(at)&at=${JSON.stringify([
            "countries[0].name",
            "countries[4].name"
        ])}`);


        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual(["Afghanistan", "Australia"])
        })
    })


    test("has", () => {
        let url = new URL(`${HOST}/?query=has-countries[0].name`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: true})
        })

        url = new URL(`${HOST}/?query=has-countries[0].nothere`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();

            expect(data).toEqual({$value: false})
        })
    })

    test("keys", () => {
        let url = new URL(`${HOST}/?query=keys`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual(["countries"])
        })

        // First proof of chained filters.
        url = new URL(`${HOST}/?query=get-countries[0],keys`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();

            expect(data).toEqual(["name", "code", "capital", "region", "population", "currency"])
        })
    })

    test("values", () => {
        let url = new URL(`${HOST}/?query=get-countries[0],values`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
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
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
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
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
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
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]])
        })
    })

    test("first", () => {
        let url = new URL(`${HOST}/?query=first`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 1})
        })
    })

    test("last", () => {
        let url = new URL(`${HOST}/?query=last`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 10})
        })
    })

    test("nth", () => {
        let url = new URL(`${HOST}/?query=nth-3`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 4})
        })
    })

    test("reverse", () => {
        let url = new URL(`${HOST}/?query=reverse`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
        })
    })

    test("slice", () => {
        let url = new URL(`${HOST}/?query=slice-2-5`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual([3, 4, 5])
        })
    })

    test("take", () => {
        let url = new URL(`${HOST}/?query=take-3`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual([1, 2, 3])
        })
    })

    test("takeRight", () => {
        let url = new URL(`${HOST}/?query=takeRight-3`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual([8, 9, 10])
        })
    })

    test("mapPick", () => {
        let url = new URL(`${HOST}/?query=mapPick-name-code`);
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data[0]).toEqual({
                name: "Afghanistan",
                code: "AF",
            })
        })
    })

    test("mapOmit", () => {
        let url = new URL(`${HOST}/?query=mapOmit-name-code`);
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data[0].name).toBeUndefined()
            expect(data[0].code).toBeUndefined()
            expect(data[0].capital).toBeDefined()
        })
    })

})


describe("Lang Filters", () => {
    test("castArray", () => {
        let url = new URL(`${HOST}/?query=get-countries[0].name,castArray`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual(["Afghanistan"])
        })
    })

    test("isArray", () => {
        let url = new URL(`${HOST}/?query=get-countries,isArray`);
        jsb_queryObject<any>(countriesObject, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: true})
        })
    })
})


describe("Math Filters", () => {
    test("max", () => {
        let url = new URL(`${HOST}/?query=max`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 10})
        })
    })

    test("min", () => {
        let url = new URL(`${HOST}/?query=min`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 1})
        })
    })

    test("sum", () => {
        let url = new URL(`${HOST}/?query=sum`);
        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 55})
        })
    })
})

describe("Collection Filters", () => {
    test("find", () => {
        const users = JSON.stringify([
            {'user': 'barney', 'age': 36, 'active': true},
            {'user': 'fred', 'age': 40, 'active': false},
            {'user': 'pebbles', 'age': 1, 'active': true}
        ]);

        let url = new URL(`${HOST}/?query=find-json(findFilter)&findFilter=${JSON.stringify({age: 1, active: true})}`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({'user': 'pebbles', 'age': 1, 'active': true})
        })

        url = new URL(`${HOST}/?query=find-json(findFilter)&findFilter=${JSON.stringify(['age', 40])}`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({'user': 'fred', 'age': 40, 'active': false})
        })

        url = new URL(`${HOST}/?query=find-active`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({'user': 'barney', 'age': 36, 'active': true})

        })
    })


    test("findLast", () => {
        const users = JSON.stringify([
            {'user': 'barney', 'age': 36, 'active': true},
            {'user': 'fred', 'age': 40, 'active': false},
            {'user': 'pebbles', 'age': 36, 'active': true},
            {'user': 'kruger', 'age': 40, 'active': false},
        ]);

        let url = new URL(`${HOST}/?query=findLast-json(findFilter)&findFilter=${JSON.stringify({
            age: 40,
            active: false
        })}`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({'user': 'kruger', 'age': 40, 'active': false})
        })

        url = new URL(`${HOST}/?query=findLast-json(findFilter)&findFilter=${JSON.stringify(['age', 36])}`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({'user': 'pebbles', 'age': 36, 'active': true})
        })

        url = new URL(`${HOST}/?query=findLast-active`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({'user': 'pebbles', 'age': 36, 'active': true})

        })
    })

    test("filter", () => {
        let url = new URL(`${HOST}/?query=filter-json(data)&data=${JSON.stringify({currency: "EUR"})}`);
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toBeArray();
            expect(data.length).toBeGreaterThan(0);
            data.forEach((item: any) => {
                expect(item.currency).toEqual("EUR");
            })
        })
    })


    test("size", () => {
        let url = new URL(`${HOST}/?query=filter-json(data),size&data=${JSON.stringify({currency: "USD"})}`);
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 1})
        })


        url = new URL(`${HOST}/?query=nth-0,size`);
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 6})
        })

        url = new URL(`${HOST}/?query=nth-0,get-code,size`);
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 2})
        })
    })

    test("every", () => {
        let url = new URL(`${HOST}/?query=filter-json(filter),every-json(condition)`);

        url.searchParams.append("filter", JSON.stringify({currency: "EUR"}));
        url.searchParams.append("condition", JSON.stringify({region: "Europe"}));

        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: true})
        })
    })

    test("sortBy", () => {
        const users = JSON.stringify([
            {'user': 'fred', 'age': 48},
            {'user': 'barney', 'age': 34},
            {'user': 'fred', 'age': 40},
            {'user': 'barney', 'age': 36}
        ]);

        let url = new URL(`${HOST}/?query=sortBy-age,nth-0,get-age`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 34})

        })
    })

    test("orderBy", () => {
        const users = JSON.stringify([
            {'user': 'fred', 'age': 48},
            {'user': 'barney', 'age': 34},
            {'user': 'fred', 'age': 40},
            {'user': 'barney', 'age': 36}
        ]);

        let url = new URL(`${HOST}/?query=orderBy-age-desc,nth-0,get-age`);
        jsb_queryObject<any>(users, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: 48})
        })
    })

    test("reject", () => {
        let url = new URL(`${HOST}/?query=filter-json(filter),nth-0,get-name`);
        url.searchParams.append("filter", JSON.stringify({region: "Europe"}));
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: "Albania"})
        })

        url = new URL(`${HOST}/?query=filter-json(filter),reject-json(reject),nth-0,get-name`);
        url.searchParams.append("filter", JSON.stringify({region: "Europe"}));
        url.searchParams.append("reject", JSON.stringify({code: "AL"}));

        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toEqual({$value: "Austria"})

        })
    })

    test("shuffle", () => {
        const numbers = JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        let url = new URL(`${HOST}/?query=shuffle`);

        jsb_queryObject<any>(numbers, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toBeArray();
            expect(data).not.toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        })
    })

    test("map", () => {
        let url = new URL(`${HOST}/?query=map-name,slice-0-3`);
        jsb_queryObject<any>(countries, url, (data) => {
            expect(data).toBeDefined();
            expect(data).toBeArray();
            expect(data).toHaveLength(3);
            expect(data).toEqual(["Afghanistan", "Albania", "Algeria"])
        })
    })
})


