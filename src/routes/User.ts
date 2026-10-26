import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { tokenCreator } from '../middlawere/OAuth.js';
import { db } from '../structures/db.js';

const UserRouter = express.Router();

// Controle em memória contra ataques de força bruta (Brute Force Protection)
interface AttemptRecord {
  count: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 10 * 60 * 1000; // 10 minutos

UserRouter.get('/', (req: any, res: any) => res.redirect('/user/login'));

UserRouter.get('/login', (req: any, res: any) => {
  if (req.cookies.token) return res.redirect('/admin');
  res.sendFile('login.html', { root: './src/public/_LOGIN' });
});

UserRouter.get('/logout', (req: any, res: any) => {
  res.clearCookie('token');
  return res.redirect('/user/login');
});

UserRouter.post('/login', (req: Request, res: Response) => {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const now = Date.now();
  const attemptRecord = loginAttempts.get(ip);

  // Verifica se o IP está temporariamente bloqueado
  if (attemptRecord && attemptRecord.blockedUntil > now) {
    const remainingMinutes = Math.ceil((attemptRecord.blockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Muitas tentativas incorretas. Acesso bloqueado por ${remainingMinutes} minuto(s).`,
    });
  }

  const { email, password } = req.body;
  const accounts: Record<string, any> = db.get('accounts') || {};

  const account =
    accounts[email] ||
    Object.values(accounts).find(
      (acc: any) => acc.email === email || acc.identifier === email
    );

  // Validação segura com Bcrypt (suporta hash e fallback gracioso)
  const isPasswordValid =
    account &&
    (account.password.startsWith('$2')
      ? bcrypt.compareSync(password || '', account.password)
      : account.password === password);

  if (!account || !isPasswordValid) {
    const currentCount = (attemptRecord?.count || 0) + 1;

    if (currentCount >= MAX_ATTEMPTS) {
      loginAttempts.set(ip, {
        count: currentCount,
        blockedUntil: now + BLOCK_TIME_MS,
      });
      return res.status(429).json({
        error:
          'Limite de 5 tentativas excedido. Acesso bloqueado por 10 minutos por segurança.',
      });
    }

    loginAttempts.set(ip, { count: currentCount, blockedUntil: 0 });
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Login com sucesso: limpa o histórico de tentativas do IP
  loginAttempts.delete(ip);

  const id = tokenCreator(account.email || email);

  res.cookie('token', id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 3600000, // 8 horas de sessão administrativa
  });

  return res.status(200).json({ message: 'Login bem-sucedido', status: 200 });
});

export { UserRouter };
