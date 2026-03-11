'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Avaliacao', {
      ID_Avaliacao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      ID_Avaliador: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'idUsuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ID_Avaliado: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'idUsuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      Comentario: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Estrelas: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Avaliacao');
  }
};
