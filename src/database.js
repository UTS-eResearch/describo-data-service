const { Sequelize, Model, DataTypes } = require("sequelize");
const { has, isArray, isPlainObject, chunk } = require("lodash");
let models = [require("./model.data"), require("./model.source")];
const { readJson, pathExists } = require("fs-extra");
const Op = Sequelize.Op;

class Database {
    constructor({ databaseFile }) {
        this.databaseFile = databaseFile;

        let sequelize = new Sequelize(`sqlite:${this.databaseFile}`, {
            logging: false,
        });

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
        const sourceModel = this.models.source;
        const dataModel = this.models.data;

        let data;
        if (file && (await pathExists(file))) {
            data = await readJson(file);
            this.verifyInputData({ data });
            await sourceModel.upsert({ file });
        } else if (url) {
            let response = await fetch(url, { cache: "reload" });
            if (response.status !== 200) {
                throw new Error(response);
            }
            data = await response.json();
            this.verifyInputData({ data });
            await sourceModel.upsert({ url });
        }

        for (let c of chunk(data, chunkSize)) {
            await dataModel.bulkCreate(c, {
                updateOnDuplicate: ["@id"],
            });
        }
    }

    async query({ "@id": id, "@type": type, name, description }) {
        const dataModel = this.models.data;
        let where = {};
        if (id) where["@id"] = { [Op.substring]: id };
        if (type) where["@type"] = { [Op.substring]: type };
        if (name) where.name = { [Op.substring]: name };
        if (description) where.description = { [Op.substring]: description };
        return await dataModel.findAll({ where }).map((result) => {
            return {
                id: result.get("id"),
                "@id": result.get("@id"),
                "@type": result.get("@type"),
                name: result.get("name"),
                description: result.get("description"),
            };
        });
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
                    `Each entry in the data must have an name property`
                );
            if (!has(entry, "data"))
                throw new Error(
                    `Each entry in the data must have an data property`
                );
            if (!isPlainObject(entry.data))
                throw new Error(
                    `The data property of an entry must be an object`
                );
            if (!has(entry.data, "@id"))
                throw new Error(`The data object must have an @id property`);
            if (!has(entry.data, "@type"))
                throw new Error(`The data object must have an @type property`);
        }
    }
}

module.exports = Database;
