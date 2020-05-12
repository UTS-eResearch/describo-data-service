"use strict";
const { Model, DataTypes } = require("sequelize");

class Source extends Model {}

function init(sequelize) {
    Source.init(
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            file: {
                type: DataTypes.STRING,
                unique: true,
            },
            url: {
                type: DataTypes.STRING,
                unique: true,
            },
        },
        {
            sequelize,
            modelName: "source",
        }
    );
}
module.exports = init;
