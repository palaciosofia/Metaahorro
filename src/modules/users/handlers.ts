import { getServices } from '../../container';
import { httpHandler, json } from '../../shared/http';
import { parseBody } from '../../shared/validation';
import { loginSchema, registerSchema } from './auth.schemas';

export const register = httpHandler(async (event) => {
  const user = await getServices().auth.register(parseBody(registerSchema, event));
  return json(201, { user });
});

export const login = httpHandler(async (event) => {
  const session = await getServices().auth.login(parseBody(loginSchema, event));
  return json(200, session);
});
