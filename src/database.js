const { Sequelize, Model, DataTypes } = require("sequelize");
const { has, isArray, isPlainObject, chunk, isEmpty } = require("lodash");
let models = [require("./model.data"), require("./model.source")];
const { readJson, pathExists } = require("fs-extra");
const Op = Sequelize.Op;

class Database {
    constructor({ databaseFile, config }) {
        this.databaseFile = databaseFile;

        let sequelize;
        if (databaseFile) {
            sequelize = new Sequelize("", "", "", {
                dialect: "sqlite",
                storage: this.databaseFile,
                logging: false,
            });
        } else if (config) {
            sequelize = new Sequelize(
                config.database,
                config.username,
                config.password,
                {
                    dialect: config.dialect,
                    host: config.host,
                    logging: config.logging || false,
                }
            );
        }

        // Initialize models
        models.forEach((model) => {
            model(sequelize);
        });
        this.sequelize = sequelize;
        this.models = sequelize.models;
    }

    async connect() {
        await this.sequelize.sync();
        return this.sequelize.models;
    }

    async load({ file, url, chunkSize = 10 }) {
        let data;
        if (file && (await pathExists(file))) {
            data = await readJson(file);
            this.verifyInputData({ data });
            await this.models.source.upsert({ file });
        } else if (url) {
            let response = await fetch(url, { cache: "reload" });
            if (response.status !== 200) {
                throw new Error(response);
            }
            data = await response.json();
            this.verifyInputData({ data });
            await this.models.source.upsert({ url });
        }

        for (let c of chunk(data, chunkSize)) {
            c = c.map((entry) => {
                return {
                    "@id": entry["@id"],
                    "@type": entry["@type"],
                    name: entry.name,
                    description: entry.description,
                    data: entry,
                };
            });
            await this.models.data.bulkCreate(c, {
                updateOnDuplicate: ["@id"],
            });
        }
    }

    async query({
        queryType = "or",
        "@type": type,
        "@id": id,
        name,
        description,
        limit = 10,
    }) {
        if (!type) throw new Error(`@type must be defined for all queries.`);

        let where = {};
        if (id) where["@id"] = { [Op.substring]: id };
        if (name) where.name = { [Op.substring]: name };
        if (description) where.description = { [Op.substring]: description };

        if (queryType === "or") {
            if (!isEmpty(where)) {
                where = {
                    [Op.and]: {
                        "@type": { [Op.substring]: type },
                        [Op.or]: where,
                    },
                };
            }
        } else if (queryType === "and") {
            where["@type"] = { [Op.substring]: type };
            where = {
                [Op.and]: where,
            };
        }
        return await this.models.data
            .findAll({
                where,
                limit,
                order: [["name", "ASC"]],
            })
            .map((result) => {
                return {
                    id: result.get("id"),
                    "@id": result.get("@id"),
                    "@type": result.get("@type"),
                    name: result.get("name"),
                };
            });
    }

    async getTypes() {
        return (
            await this.models.data
                .findAll({
                    attributes: [
                        [
                            Sequelize.fn("DISTINCT", Sequelize.col("@type")),
                            "types",
                        ],
                    ],
                })
                .map((result) => result.get("types"))
        ).sort();
    }

    async get({ "@id": id }) {
        return (
            await this.models.data.findOne({
                where: {
                    "@id": id,
                },
            })
        ).get("data");
    }

    verifyInputData({ data }) {
        if (!isArray(data)) {
            throw new Error(`Data must be an array`);
        }
        for (let entry of data) {
            if (!isPlainObject(entry)) {
                throw new Error(`Each entry in the data must be an object`);
            }
            if (!has(entry, "@id"))
                throw new Error(
                    `Each entry in the data must have an @id property`
                );
            if (!has(entry, "@type"))
                throw new Error(
                    `Each entry in the data must have an @type property`
                );
            if (!has(entry, "name"))
                throw new Error(
                    `Each entry in the data must have a name property`
                );
        }
    }
}

module.exports = Database;
