import { UsuarioModel } from './usuario.model';
import { ViagemModel } from './viagem.model';
import { ViajemAgendadaModel } from './viajem_agendada.model';

// NOVOS MODELS
import { ConversaCaronaModel } from './conversa_carona.model';
import { MensagemConversaModel } from './mensagem_conversa.model';

// ================= RELAÇÕES EXISTENTES =================

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

// ================= ASSOCIAÇÕES DE AGENDAMENTO =================

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

// ================= NOVO: CONVERSAS =================

// Uma viagem pode ter várias conversas
ViagemModel.hasMany(ConversaCaronaModel, {
  foreignKey: 'idViagem',
  as: 'conversas',
});

// Conversa pertence à viagem
ConversaCaronaModel.belongsTo(ViagemModel, {
  foreignKey: 'idViagem',
  as: 'viagem',
});

// Usuário (motorista) tem várias conversas
UsuarioModel.hasMany(ConversaCaronaModel, {
  foreignKey: 'idMotorista',
  as: 'conversasMotorista',
});

// Conversa pertence ao motorista
ConversaCaronaModel.belongsTo(UsuarioModel, {
  foreignKey: 'idMotorista',
  as: 'motorista',
});

// Usuário (passageiro) tem várias conversas
UsuarioModel.hasMany(ConversaCaronaModel, {
  foreignKey: 'idPassageiro',
  as: 'conversasPassageiro',
});

// Conversa pertence ao passageiro
ConversaCaronaModel.belongsTo(UsuarioModel, {
  foreignKey: 'idPassageiro',
  as: 'passageiro',
});

// ================= NOVO: MENSAGENS =================

// Uma conversa tem várias mensagens
ConversaCaronaModel.hasMany(MensagemConversaModel, {
  foreignKey: 'idConversa',
  as: 'mensagens',
});

// Mensagem pertence à conversa
MensagemConversaModel.belongsTo(ConversaCaronaModel, {
  foreignKey: 'idConversa',
  as: 'conversa',
});

// Usuário envia várias mensagens
UsuarioModel.hasMany(MensagemConversaModel, {
  foreignKey: 'idRemetente',
  as: 'mensagensEnviadas',
});

// Mensagem pertence ao usuário (remetente)
MensagemConversaModel.belongsTo(UsuarioModel, {
  foreignKey: 'idRemetente',
  as: 'remetente',
});