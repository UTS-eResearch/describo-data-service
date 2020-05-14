const Database = require("./database");
const path = require("path");
const { remove, writeJson } = require("fs-extra");

test("it should be able to get a handle to an sqlite database", async () => {
    const databaseFile = path.join(__dirname, "database.sqlite");
    await remove(databaseFile);

    const database = new Database({ databaseFile });
    const { data } = await database.connect();
    // expect(data).toBeDefined();
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
    ({ data } = database.models);
    const results = await data.findAll();
    expect(results.length).toBe(1);
    const result = results[0].get();
    expect(result["@id"]).toBe("1");
    expect(result["@type"]).toBe("Product");
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
    await database.load({ file: dataPack });
    let types = await database.getTypes();
    expect(types).toEqual(["Person", "Product"]);

    await remove(dataPack);
    await remove(databaseFile);

    data = [];
    await remove(dataPack);
    await writeJson(dataPack, data);
    await remove(databaseFile);

    database = new Database({ databaseFile });
    await database.connect();
    await database.load({ file: dataPack });
    types = await database.getTypes();
    expect(types).toEqual([]);

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
