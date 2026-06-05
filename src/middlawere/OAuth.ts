import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bg from 'bcryptjs';
const { SESSION_SECRET, COOKIE_SECRET } = process.env;

function tokenCreator(userId: string) {
  if (!SESSION_SECRET)
    console.warn(
      'SESSION_SECRET não definido no .env, isso pode causar problemas de segurança!'
    );
  if (!COOKIE_SECRET)
    console.warn(
      'COOKIE_SECRET não definido no .env, isso pode causar problemas de segurança!'
    );

  let tokenized;

  try {
    tokenized = jwt.sign({ id: userId }, SESSION_SECRET || '', {
      expiresIn: '1h',
    });
  } catch (error) {
    console.error('Erro ao criar token:', error);
  }

  return tokenized;
}

function AuthenticationOnToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.url.includes('/login')) return next();
  /*
    const token = req.cookies.token;
    if(!token) return res.status(401).json({ error: "Token não fornecido" });

    jwt.verify(token, COOKIE_SECRET || "", (err: any, decoded: any) => {
        if(err) return res.status(401).json({ error: "Token inválido" });
        req.body.userId = decoded.id;
        next();
    });
*/
  next();
}

export { tokenCreator, AuthenticationOnToken as T };
