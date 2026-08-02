import { Router } from 'express';
import { generateTTS } from '../IA/Algorithm.js';
import { db } from '../structures/db.js';

const AdmRouter = Router();

AdmRouter.get('/', (req: any, res: any) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/user/login');
  res.sendFile('admin.html', { root: './src/public/_ADMIN' });
});

AdmRouter.get('/settings', async (req: any, res: any) => {
  const settings = db.get('settings');

  if (!req.cookies.token)
    return res.status(401).json({
      status: 401,
      message: 'sem autorização',
    });

  if (settings) {
    return res.status(200).json({
      status: 200,
      settings,
    });
  } else return res.status(204);
});

AdmRouter.post('/set-settings', async (req: any, res: any) => {
  /*
  {
  "monitor_exibicao": {
    "atualizacao_automatica": true,
    "tempo_transicao_segundos": 15,
    "token_pareamento_visivel": false
  },
  "voz_sintese_ia": {
    "engine_modelo": "espeak-ng",
    "velocidade_fala_percentual": 65,
    "anunciar_pratos_automaticamente": false
  },
  "plugins_modulos": {
    "chatbot_atendimento_ativo": true,
    "integracao_oauth_ativa": true,
    "logs_auditoria_cache_local": false
  }
}
  */
  const { monitor, ia_speech, plugins } = req.body;

  if (!req.cookies.token)
    return res.status(401).json({
      status: 401,
      message: 'sem autorização',
    });

  if (monitor)
    Object.keys(monitor).forEach((x: any) =>
      db.update('settings', 'monitor.' + x, monitor[x])
    );
  if (ia_speech)
    Object.keys(ia_speech).forEach((x: any) =>
      db.update('settings', 'ia_speech.' + x, ia_speech[x])
    );
  if (plugins)
    Object.keys(plugins).forEach((x: any) =>
      db.update('settings', 'plugins.' + x, plugins[x])
    );

  return res.status(200).json({
    settings: db.get('settings'),
    status: 200,
  });
});

AdmRouter.post('/tts', async (req: any, res: any) => {
  const message = req.body.message;
});

export { AdmRouter };
