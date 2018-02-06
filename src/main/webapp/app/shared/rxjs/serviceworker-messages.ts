import { UserContext, Credentials } from '../auth/auth-priovider';

export const MSG_GET_USER: SwMessage<void, UserContext> = { msg: 'MSG_GET_USER' };
export const MSG_LOGIN: SwMessage<Credentials, UserContext> = { msg: 'MSG_LOGIN' };
export const MSG_LOGOUT: SwMessage<void, void> = { msg: 'MSG_LOGOUT' };

export type SwMessage<RequestType, ResponseType> = {
    msg: string
};
