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

test("verifying input data", () => {
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
        message: "Each entry in the data must have an name property",
    });

    data = [{ "@id": "1", "@type": "Person", name: "x" }];
    expectTestToThrow({
        data,
        message: "Each entry in the data must have an data property",
    });

    data = [{ "@id": "1", "@type": "Person", name: "x", data: "" }];
    expectTestToThrow({
        data,
        message: "The data property of an entry must be an object",
    });

    data = [{ "@id": "1", "@type": "Person", name: "x", data: {} }];
    expectTestToThrow({
        data,
        message: "The data object must have an @id property",
    });

    data = [{ "@id": "1", "@type": "Person", name: "x", data: { "@id": "1" } }];
    expectTestToThrow({
        data,
        message: "The data object must have an @type property",
    });

    data = [
        {
            "@id": "1",
            "@type": "Person",
            name: "x",
            data: { "@id": "1", "@type": "Person" },
        },
    ];
    expectTestToThrow({
        data,
        message: "The data object must have an @type property",
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
            data: {
                "@id": "1",
                "@type": "Product",
                name: "describo",
            },
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
            data: {
                "@id": "1",
                "@type": "Product",
                name: "describo",
            },
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
            data: {
                "@id": "1",
                "@type": "Product",
                name: "describo",
            },
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
