'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona campos de foto na tabela 'usuario'
    await queryInterface.addColumn('usuario', 'fotoUrl', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL pública da foto do usuário (se usar bucket público)'
    });

    await queryInterface.addColumn('usuario', 'fotoPath', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Caminho do arquivo no Supabase Storage (se usar bucket privado/signed URL)'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove os campos caso precise reverter
    await queryInterface.removeColumn('usuario', 'fotoUrl');
    await queryInterface.removeColumn('usuario', 'fotoPath');
  }
};
