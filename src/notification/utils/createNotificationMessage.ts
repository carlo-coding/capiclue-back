import { NotificationTypes } from '../constants/NotificationTypes';

interface ICreateMessageParams {
  score?: number;
  userName?: string;
  actionType?: NotificationTypes;
}
export function createNotificationMessage({
  score,
  userName,
  actionType,
}: ICreateMessageParams) {
  switch (actionType) {
    case NotificationTypes.WELCOME:
      return `Bienvenido a capiclub ${userName}!`;
    case NotificationTypes.VERIFY_EMAIL:
      return `Hola usuario ${userName}, verifica tu correo para poder crear publicaciones y comentarios`;
    case NotificationTypes.PASSWORD_RESET:
      return 'Se ha cambiado tu contraseña con éxito';
    case NotificationTypes.FRIEND_REQUEST:
      return `El usuario ${userName} te ha mandado una solicitud de amistad`;
    case NotificationTypes.FRIEND_REQUEST_REJECTED:
      return `El usuario ${userName} ha rechazado tu solicitud de amistad`;
    case NotificationTypes.NEW_COMMENT:
      let sentiment = 'neutro';
      if (score > 0) {
        sentiment = 'positivo';
      } else if (score < 0) {
        sentiment = 'negativo';
      }
      return `El usuario ${userName} ha hecho un comentario ${sentiment} en una de tus publicaciones`;
    default:
      return 'Notificación vacía';
  }
}
