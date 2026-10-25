import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string =
  process.env.SESSION_SECRET ||
  process.env.COOKIE_SECRET as string;

function tokenCreator(userId: string): string {
  try {
    return jwt.sign({ id: userId }, JWT_SECRET as string, {
      expiresIn: '8h',
    });
  } catch (error) {
    console.error('Erro ao criar token:', error);
    return '';
  }
}

/**
 * Middleware global de contexto de autenticação:
 * Se houver token válido, anexa req.user. Não bloqueia rotas públicas da TV/monitor.
 */
function AuthenticationOnToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = (req as any).cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
    } catch {
      res.clearCookie('token');
    }
  }
  next();
}

/**
 * Middleware rigoroso para proteção de rotas administrativas e de mutação (POST/PUT/DELETE).
 * Impede que usuários não autenticados na rede local alterem cardápio ou rotinas.
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token =
    (req as any).cookies?.token ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  if (!token) {
    if (req.method === 'GET' && !req.xhr && req.accepts('html')) {
      return res.redirect('/user/login');
    }
    return res.status(401).json({
      status: 401,
      error: 'Acesso não autorizado. Faça login como administrador.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    return next();
  } catch {
    res.clearCookie('token');
    if (req.method === 'GET' && !req.xhr && req.accepts('html')) {
      return res.redirect('/user/login');
    }
    return res.status(401).json({
      status: 401,
      error: 'Sessão expirada ou token inválido. Faça login novamente.',
    });
  }
}

export { tokenCreator, AuthenticationOnToken as T, requireAuth };
