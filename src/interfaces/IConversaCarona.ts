export interface IConversaCarona {
  idConversa?: number;
  idViagem: number;
  idMotorista: number;
  idPassageiro: number;
  status: string;
  aceiteMotorista: boolean;
  aceitePassageiro: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}