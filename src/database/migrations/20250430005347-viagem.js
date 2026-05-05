'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('viagem', {
      idViagem: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tipoUsuario: {
        type: Sequelize.STRING,
        allowNull: false
      },
      partida: {
        type: Sequelize.STRING,
        allowNull: false
      },
      destino: {
        type: Sequelize.STRING,
        allowNull: false
      },
      horarioEntrada: {
        type: Sequelize.STRING,
        allowNull: false
      },
      horarioSaida: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ajudaDeCusto: {
        type: Sequelize.STRING,
        allowNull: false
      },
      idUsuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'idUsuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      // CANCELAMENTO
      cancelada: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      canceladaPor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuario',
          key: 'idUsuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      dataCancelamento: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('viagem');
  }
};