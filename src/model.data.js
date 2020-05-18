"use strict";

module.exports = function (sequelize, DataTypes) {
    let Data = sequelize.define(
        "data",
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
                unique: true,
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
            indexes: [
                { fields: ["@type"] },
                { fields: ["@type", "@id"] },
                { fields: ["@type", "name"] },
                { fields: ["@type", "description"] },
            ],
        }
    );
    Data.associate = function (models) {
        Data.belongsTo(models.source, { onDelete: "cascade" });
    };
    return Data;
};
