export interface IMensagemConversa {
  idMensagem?: number;
  idConversa: number;
  idRemetente: number;
  mensagem: string;
  lida?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}