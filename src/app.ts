/**
 * Bibliotecas do projeto
 */
import express, { Response, Request, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import c from 'cookie-parser';
import data from './structures/Database.js';
import './utils/tempManage.js';
import 'dotenv/config';

/**
 * Configuração do banco de dados (usando a estrutura personalizada Database) para armazenar o cardápio. O banco de dados é persistente e armazena os dados em um arquivo chamado "cardapio.data".
 */
const db = new data.Database('cardapio.data', true);
/**
 * Rotas da API (ENDPOINTS).
 */
import { AdmRouter } from './routes/Adm.js';
import { HorariosRouter } from './routes/Horarios.js';
import { UserRouter } from './routes/User.js';

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
  res.send('ola mundo');
});
App.use('/horarios', HorariosRouter);
App.use('/admin', AdmRouter);
App.get('/pages/:page', async (req: any, res: any) => {
  const page = req.params.page || 'main';

  if (
    fs.existsSync(
      path.resolve(process.cwd(), 'src', 'public', 'pages') + `/${page}`
    )
  ) {
    res.sendFile(
      path.resolve(process.cwd(), 'src', 'public', 'pages') + `/${page}`
    );
  } else {
    res.status(404).send('Página não encontrada');
  }
});
App.use('/user', UserRouter);

export { App, db };
