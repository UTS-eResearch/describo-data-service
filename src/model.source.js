"use strict";

module.exports = function (sequelize, DataTypes) {
    let Source = sequelize.define("source", {
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
    });
    Source.associate = function (models) {
        Source.hasMany(models.data);
    };
    return Source;
};
