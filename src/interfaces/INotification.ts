export interface INotification {
  id?: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
