'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logAcesso', {
      idLogAcesso: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      dataAcesso: {
        type: Sequelize.DATE,
        allowNull: false
      },
      tipoUsuario: {
        type: Sequelize.ENUM('passageiro', 'motorista'),
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('logAcesso');
  }
};
