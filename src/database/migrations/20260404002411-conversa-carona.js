'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversa_carona', {
      idConversa: {
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

      idMotorista: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'idUsuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      idPassageiro: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'idUsuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendente'
      },

      aceiteMotorista: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      aceitePassageiro: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
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

    // NOVO: impede conversa duplicada para a mesma viagem/motorista/passageiro
    await queryInterface.addConstraint('conversa_carona', {
      fields: ['idViagem', 'idMotorista', 'idPassageiro'],
      type: 'unique',
      name: 'unique_conversa_viagem_motorista_passageiro'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversa_carona');
  }
};