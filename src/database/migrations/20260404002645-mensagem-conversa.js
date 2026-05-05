'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mensagem_conversa', {
      idMensagem: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      idConversa: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conversa_carona',
          key: 'idConversa'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      idRemetente: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'idUsuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      mensagem: {
        type: Sequelize.STRING(500),
        allowNull: false
      },

      lida: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('mensagem_conversa');
  }
};