const { Sequelize, Model, DataTypes } = require("sequelize");
let modules = [require("./data.model")];
const models = [];

class Setup {
    constructor({ databaseFile }) {
        this.databaseFile = databaseFile;

        let sequelize = new Sequelize(`sqlite:${this.databaseFile}`, {
            logging: false,
        });

        // Initialize models
        modules.forEach((module) => {
            module(sequelize);
        });
        this.sequelize = sequelize;
    }

    async connect() {
        await this.sequelize.sync();
        return this.sequelize.models;
    }
}

module.exports = Setup;
