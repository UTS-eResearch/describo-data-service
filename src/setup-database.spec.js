const Setup = require("./setup-database");
const path = require("path");
const { remove } = require("fs-extra");

test("it should be able to get a handle to an sqlite database", async () => {
    const databaseFile = path.join(__dirname, "database.sqlite");
    const database = new Setup({ databaseFile });
    const { data } = await database.connect();
    expect(data).toBeDefined();
    await remove(databaseFile);
});
