'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('veiculo', {
      ID_veiculo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      Placa_veiculo: {
        type: Sequelize.STRING(8),
        allowNull: true
      },
      Cor: {
        type: Sequelize.STRING(15),
        allowNull: false
      },
      Modelo: {
        type: Sequelize.STRING(15),
        allowNull: false
      },
      Ano: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      idUsuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "usuario",
          key: "idUsuario"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("veiculo", "veiculo_idUsuario_fkey").catch(() => {});

    await queryInterface.dropTable("veiculo");
  }
};
