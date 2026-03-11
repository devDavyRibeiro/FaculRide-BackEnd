export interface ILogAcesso {
  idLogAcesso: number; 
  idUsuario: number;   
  dataAcesso: Date;    
  tipoUsuario: "passageiro" | "motorista";
}
