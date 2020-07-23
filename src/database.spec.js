const Database = require("./database");
const path = require("path");
const { remove, writeJson } = require("fs-extra");

test("it should be able to get a handle to an sqlite database", async () => {
    const databaseFile = path.join(__dirname, "database.sqlite");
    await remove(databaseFile);

    const database = new Database({ databaseFile });
    await database.connect();
    await remove(databaseFile);
});
test("test verifying input data", () => {
    const databaseFile = path.join(__dirname, "database.sqlite");
    const database = new Database({ databaseFile });

    let data = {};
    expectTestToThrow({ data, message: "Data must be an array" });

    data = ["value"];
    expectTestToThrow({
        data,
        message: "Each entry in the data must be an object",
    });

    data = [{}];
    expectTestToThrow({
        data,
        message: "Each entry in the data must have an @id property",
    });

    data = [{ "@id": "1" }];
    expectTestToThrow({
        data,
        message: "Each entry in the data must have an @type property",
    });

    data = [{ "@id": "1", "@type": "Person" }];
    expectTestToThrow({
        data,
        message: "Each entry in the data must have a name property",
    });

    function expectTestToThrow({ data, message }) {
        try {
            database.verifyInputData({ data });
        } catch (error) {
            expect(error.message).toMatch(message);
        }
    }
});
test("it should be able to load data from a file", async () => {
    let data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
    ];
    const dataPack = path.join(__dirname, "data-pack");
    const databaseFile = path.join(__dirname, "database.sqlite");

    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);

    const database = new Database({ databaseFile });
    await database.connect();
    await database.load({ file: dataPack });
    const models = database.models;
    const results = await models.data.findAll({
        include: [{ model: models.source }],
    });
    expect(results.length).toBe(1);
    const result = results[0].get();
    expect(result["@id"]).toBe("1");
    expect(result["@type"]).toBe("Product");
    expect(result.source.get("file")).toBe(dataPack);
    expect(result.name).toBe("describo");
    await remove(dataPack);
    await remove(databaseFile);
});
test("it should be able to load a file again", async () => {
    let data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
    ];
    const dataPack = path.join(__dirname, "data-pack");
    const databaseFile = path.join(__dirname, "database.sqlite");

    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);

    const database = new Database({ databaseFile });
    await database.connect();
    await database.load({ file: dataPack });
    await database.load({ file: dataPack });
    ({ data } = database.models);
    const results = await data.findAll();
    expect(results.length).toBe(1);
    const result = results[0].get();
    expect(result["@id"]).toBe("1");
    expect(result["@type"]).toBe("Product");
    expect(result.name).toBe("describo");
    await remove(dataPack);
    await remove(databaseFile);
});
test("it should be able to load data from a url", async () => {
    let data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
    ];

    global.fetch = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve({
                ok: true,
                status: 200,
                Id: "123",
                json: function () {
                    return data;
                },
            });
        });
    });

    const databaseFile = path.join(__dirname, "database.sqlite");
    await remove(databaseFile);
    const url = "http://path/to/data.pack";

    const database = new Database({ databaseFile });
    await database.connect();
    await database.load({ url });
    models = database.models;
    const results = await models.data.findAll({
        include: [{ model: models.source }],
    });
    expect(results.length).toBe(1);
    const result = results[0].get();
    expect(result["@id"]).toBe("1");
    expect(result["@type"]).toBe("Product");
    expect(result.source.get("url")).toBe(url);
    expect(result.name).toBe("describo");
    await remove(databaseFile);
});
test("it should be able to query the database", async () => {
    let data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
    ];
    const dataPack = path.join(__dirname, "data-pack");
    const databaseFile = path.join(__dirname, "database.sqlite");

    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);
    const database = new Database({ databaseFile });
    await database.connect();
    await database.load({ file: dataPack });

    // test query for without @type
    try {
        let results = await database.query({ "@id": 1 });
    } catch (error) {
        expect(error.message).toMatch("@type must be defined for all queries.");
    }

    //
    // OR QUERIES
    //

    // test query for @id
    let results = await database.query({ "@type": "Product", "@id": 1 });
    expect(results.length).toBe(1);

    // test query for @type
    results = await database.query({ "@type": "Product" });
    expect(results.length).toBe(1);

    // test query for substring match on name
    results = await database.query({ "@type": "Product", name: "esc" });
    expect(results.length).toBe(1);

    // test query for substring match on description
    results = await database.query({
        "@type": "Product",
        description: "awesome",
    });
    expect(results.length).toBe(1);

    //
    // AND QUERIES
    //
    results = await database.query({
        queryType: "and",
        "@type": "Product",
        description: "awesome",
        name: "describo",
    });
    expect(results.length).toBe(1);

    results = await database.query({
        queryType: "and",
        "@type": "Product",
        description: "awesome",
        name: "cows",
    });
    expect(results.length).toBe(0);

    // test query failure on name
    results = await database.query({ "@type": "Person", name: "awesome" });
    expect(results.length).toBe(0);

    await remove(dataPack);
    await remove(databaseFile);
});
test("it should be able to get a list of types loaded in to the database", async () => {
    let data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
        {
            "@id": "2",
            "@type": "Person",
            name: "human",
        },
    ];
    const dataPack = path.join(__dirname, "data-pack");
    const databaseFile = path.join(__dirname, "database.sqlite");

    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);

    let database = new Database({ databaseFile });
    await database.connect();

    // get all types from data pack load
    await database.load({ file: dataPack });
    let types = await database.getTypes({});
    expect(types).toEqual(["Person", "Product"]);

    // get no types
    data = [];
    await writeJson(dataPack, data);
    await database.load({ file: dataPack });
    types = await database.getTypes({});
    expect(types).toEqual([]);

    // get the types for local items only
    data = [
        {
            "@id": "3",
            "@type": "Cow",
            name: "me",
        },
    ];

    await database.put({ data });
    types = await database.getTypes({ local: true });
    expect(types).toEqual(["Cow"]);

    // get all types including local
    data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
        {
            "@id": "2",
            "@type": "Person",
            name: "human",
        },
    ];
    await writeJson(dataPack, data);
    await database.load({ file: dataPack });
    types = await database.getTypes({});
    expect(types).toEqual(["Cow", "Person", "Product"]);

    await remove(dataPack);
    await remove(databaseFile);
});
test("it should be able to retrieve a specific entry", async () => {
    let data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
    ];
    const dataPack = path.join(__dirname, "data-pack");
    const databaseFile = path.join(__dirname, "database.sqlite");

    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);
    let database = new Database({ databaseFile });
    await database.connect();
    await database.load({ file: dataPack });

    // retrieve an element by '@id'
    let result = (await database.query({ "@type": "Product", "@id": 1 }))[0];
    result = await database.get({ "@id": result["@id"] });
    expect(result).toEqual({
        "@id": "1",
        "@type": "Product",
        name: "describo",
        description: "an awesome tool!",
    });

    data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
            language: "x",
            cows: "y",
        },
    ];
    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);
    database = new Database({ databaseFile });
    await database.connect();
    await database.load({ file: dataPack });

    result = (await database.query({ "@type": "Product", "@id": 1 }))[0];
    result = await database.get({ "@id": result["@id"] });
    expect(result.language).toBe("x");
    expect(result.cows).toBe("y");

    await remove(dataPack);
    await remove(databaseFile);
});
test("it should be able to add to and update a custom item", async () => {
    let data = [
        {
            "@id": "1",
            "@type": "Person",
            name: "me",
        },
    ];

    const databaseFile = path.join(__dirname, "database.sqlite");
    let database = new Database({ databaseFile });
    await database.connect();
    await database.put({ data });

    let result = await database.get({
        "@id": data[0]["@id"],
    });
    // console.log(result);
    expect(result).toEqual(data[0]);
    expect(result).toBeDefined();

    data = [
        {
            "@id": "1",
            "@type": "Person",
            name: "me",
            description: "mojumbo",
        },
    ];
    await database.put({ data });

    result = await database.get({
        "@id": data[0]["@id"],
    });
    expect(result.description).toBe(data[0].description);
    expect(result).toEqual(data[0]);
    // console.log(result);
    await remove(databaseFile);
});
test("it should be able to remove a custom item from the store", async () => {
    const item = {
        "@id": "1",
        "@type": "Person",
        name: "me",
    };
    const data = [item];

    const databaseFile = path.join(__dirname, "database.sqlite");
    let database = new Database({ databaseFile });
    await database.connect();
    await database.put({ data });

    let result = await database.query({
        "@id": item["@id"],
        "@type": item["@type"],
    });
    expect(result.length).toBe(1);

    await database.remove({ "@id": item["@id"] });
    result = await database.query({
        "@id": item["@id"],
        "@type": item["@type"],
    });
    expect(result.length).toBe(0);

    // be graceful when passed a non-existent id - nothing should happen
    await database.remove({ "@id": item["@id"] });

    await remove(databaseFile);
});
test("getting a list of custom items from the store", async () => {
    // load a data pack
    let data = [
        {
            "@id": "1",
            "@type": "Product",
            name: "describo",
            description: "an awesome tool!",
        },
    ];
    const dataPack = path.join(__dirname, "data-pack");
    const databaseFile = path.join(__dirname, "database.sqlite");

    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);

    const database = new Database({ databaseFile });
    await database.connect();
    await database.load({ file: dataPack });

    // add some custom data
    data = [
        {
            "@id": "2",
            "@type": "Person",
            name: "me",
        },
        {
            "@id": "3",
            "@type": "Cow",
            name: "John",
        },
    ];
    await database.put({ data });

    // list local items
    let results = await database.listLocalItems({});
    // console.log(results);
    expect(results.total).toBe(2);
    expect(results.items[1]).toEqual(data[0]);
    expect(results.items[0]).toEqual(data[1]);

    // list providing offset and limit
    results = await database.listLocalItems({ offset: 0, limit: 10 });
    // console.log(results);
    expect(results.total).toBe(2);
    expect(results.items[1]).toEqual(data[0]);
    expect(results.items[0]).toEqual(data[1]);

    // find type = Cow
    results = await database.listLocalItems({
        "@type": "Cow",
        offset: 0,
        limit: 10,
    });
    // console.log(results);
    expect(results.total).toBe(1);
    expect(results.items[0]).toEqual(data[1]);

    // list providing offset, limit and order desc by name
    results = await database.listLocalItems({
        offset: 0,
        limit: 10,
        order: "DESC",
    });
    // console.log(results);
    expect(results.total).toBe(2);
    expect(results.items[0]).toEqual(data[0]);
    expect(results.items[1]).toEqual(data[1]);

    // list providing offset, limit and filter string
    results = await database.listLocalItems({
        offset: 0,
        limit: 10,
        order: "DESC",
        filter: "oh",
    });
    expect(results.total).toBe(1);
    expect(results.items[0]).toEqual(data[1]);

    await remove(databaseFile);
    await remove(dataPack);
});
test("cleanup - blank nodes", async () => {
    let data = [
        {
            "@id": "_:xxiuhfghdskfgnjsdfv",
            "@type": "Person",
            name: "me",
        },
    ];

    const databaseFile = path.join(__dirname, "database.sqlite");
    let database = new Database({ databaseFile });
    await database.connect();
    await database.put({ data });
    let results = await database.listLocalItems({});
    expect(results.items.length).toBe(1);
    await database.cleanup({});
    results = await database.listLocalItems({});
    expect(results.items.length).toBe(0);
});
