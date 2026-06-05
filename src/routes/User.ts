import express from 'express';
import { checkFor, loginAdminToken } from '../utils/adminAccounts.js';
import { tokenCreator } from '../middlawere/OAuth.js';

const UserRouter = express.Router();

UserRouter.get('/', (req: any, res: any) => res.redirect('/user/login'));

UserRouter.get('/login', (req: any, res: any) => {
  if (req.cookies.token) return res.redirect('/admin');
  res.sendFile('login.html', { root: './src/public/_LOGIN' });
});

UserRouter.get('/logout', (req: any, res: any) => {
  if (!req.cookies.token) return res.redirect('/user/login');
  res.clearCookie('token');
  return res.redirect('/user/login');
});

UserRouter.post('/login', (req: any, res: any) => {
  const { email, password } = req.body;

  if (checkFor(email) === undefined || checkFor(email)?.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const id = tokenCreator(email);

  res.cookie('token', id, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600000,
  });

  return res.status(200).json({ message: 'Login bem-sucedido', status: 200 });
});

export { UserRouter };
