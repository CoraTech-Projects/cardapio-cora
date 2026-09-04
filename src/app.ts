/**
 * Bibliotecas do projeto
 */
import express, { Response, Request } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import c from 'cookie-parser';
import { db } from './structures/db.js';
import 'dotenv/config';

/**
 * Rotas da API (ENDPOINTS).
 *
 */
import { AdmRouter } from './routes/Adm.js';
import { RotinasRouter } from './routes/Rotinas.js';
import { UserRouter } from './routes/User.js';
import { CardapioRouter } from './routes/Cardapio.js';
import { MonitorRouter } from './routes/Monitor.js';
import { T, tokenCreator } from './middlawere/OAuth.js';
/**
 * Rotas para funções middlaweres.
 */

const App = express();

App.use(express.static(path.resolve(process.cwd(), 'src') + '/public'));
App.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
App.use(bodyParser.json({ limit: '10mb' }));
App.use(cors());
App.use(c());
App.use(T);

/**
 * Configuração de middlaweres.
 */

//App.use();

/**
 * Definição das rotas.
 */

App.get('/', (req: Request, res: Response) => {
  res.redirect('/admin');
});
App.use('/rotinas', RotinasRouter);
App.use('/admin', AdmRouter);
App.use('/user', UserRouter);
App.use('/cardapio', CardapioRouter);
App.use('/monitor', MonitorRouter);

export { App };
