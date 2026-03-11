'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario', {
      idUsuario: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      cpf: {
        type: Sequelize.STRING(14),
        allowNull: false,
        unique: true
      },
      ra: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      fatec: {                      
        type: Sequelize.STRING(50),
        allowNull: false
      },
      dataNascimento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      genero: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      cep: {
        type: Sequelize.STRING(9),
        allowNull: false
      },
      endereco: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      numero: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      cidade: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      estado: {
        type: Sequelize.STRING(2),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      telefone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      senha: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      tipoUsuario: {
        type: Sequelize.ENUM("passageiro", "motorista"),
        allowNull: false
      },
      cnh: {
        type: Sequelize.STRING(20),
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuario');
  }
};
