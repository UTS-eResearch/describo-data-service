const { Sequelize, Model, DataTypes } = require("sequelize");
const { has, isArray, isPlainObject } = require("lodash");
let models = [require("./data.model")];

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
    }

    async connect() {
        await this.sequelize.sync();
        return this.sequelize.models;
    }

    async load({ data }) {
        return this.verifyInputData({ data });
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
