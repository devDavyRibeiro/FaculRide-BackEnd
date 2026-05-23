'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuario', 'cnhFotoUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('usuario', 'cnhFotoPath', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuario', 'cnhFotoUrl');
    await queryInterface.removeColumn('usuario', 'cnhFotoPath');
  },
};