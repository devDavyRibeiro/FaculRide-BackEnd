'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('viajem_agendada', {
      idAgendamento: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      idViagem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'viagem',
          key: 'idViagem'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      data: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('viajem_agendada');
  }
};
