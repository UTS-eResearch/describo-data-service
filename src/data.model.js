"use strict";
const { Model, DataTypes } = require("sequelize");

class Data extends Model {}

function init(sequelize) {
    Data.init(
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            "@id": {
                type: DataTypes.STRING,
                allowNull: false,
            },
            "@type": {
                type: DataTypes.STRING,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            data: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: {},
            },
        },
        {
            sequelize,
            modelName: "data",
            indexes: [
                { fields: ["@type"] },
                { fields: ["@type", "@id"] },
                { fields: ["@type", "name"] },
                { fields: ["@type", "description"] },
            ],
        }
    );
}
module.exports = init;
