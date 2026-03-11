import { UsuarioModel } from './usuario.model';
import { ViagemModel } from './viagem.model';
import { ViajemAgendadaModel } from './viajem_agendada.model';

// Um usuário tem muitas viagens
UsuarioModel.hasMany(ViagemModel, {
  foreignKey: 'idUsuario',
  as: 'viagens',
});

// Uma viagem pertence a um usuário
ViagemModel.belongsTo(UsuarioModel, {
  foreignKey: 'idUsuario',
  as: 'usuario',
});

// ================= Associações de Agendamento =================

// Uma viagem tem muitos agendamentos (dias específicos)
ViagemModel.hasMany(ViajemAgendadaModel, {
  foreignKey: 'idViagem',
  as: 'agendamentos',
});

// Um agendamento pertence a uma viagem
ViajemAgendadaModel.belongsTo(ViagemModel, {
  foreignKey: 'idViagem',
  as: 'viagem',
});



