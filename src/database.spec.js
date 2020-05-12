const Database = require("./database");
const path = require("path");
const { remove } = require("fs-extra");

test("it should be able to get a handle to an sqlite database", async () => {
    const databaseFile = path.join(__dirname, "database.sqlite");
    const database = new Database({ databaseFile });
    const { data } = await database.connect();
    expect(data).toBeDefined();
    await remove(databaseFile);
});

test.only("verifying input data", () => {
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
