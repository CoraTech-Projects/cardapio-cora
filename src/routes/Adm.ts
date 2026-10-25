import { Router } from 'express';
import { generateTTS } from '../IA/Algorithm.js';
import { db } from '../structures/db.js';
import { requireAuth } from '../middlawere/OAuth.js';

const AdmRouter = Router();

AdmRouter.get('/', requireAuth, (req: any, res: any) => {
  res.sendFile('admin.html', { root: './src/public/_ADMIN' });
});

AdmRouter.get('/settings', requireAuth, async (req: any, res: any) => {
  const settings = db.get('settings');

  if (settings) {
    return res.status(200).json({
      status: 200,
      settings,
    });
  } else return res.status(204);
});

AdmRouter.post('/set-settings', requireAuth, async (req: any, res: any) => {
  const { monitor, ia_speech, plugins } = req.body;

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

AdmRouter.get('/tts/:text', async (req: any, res: any) => {
  try {
    const ttsText = req.params.text;
    const audioBuffer = await generateTTS(ttsText);
    if (!audioBuffer) return res.status(400).send('Erro ao gerar áudio');
    res.setHeader('Content-Type', 'audio/wav');
    return res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Erro na rota TTS GET:', error);
    return res.status(500).json({ error: 'Falha ao sintetizar áudio' });
  }
});

AdmRouter.post('/tts', async (req: any, res: any) => {
  try {
    const message = req.body.message || req.body.text;
    if (!message)
      return res.status(400).json({ error: 'Mensagem não fornecida' });
    const audioBuffer = await generateTTS(message);
    if (!audioBuffer) return res.status(400).send('Erro ao gerar áudio');
    res.setHeader('Content-Type', 'audio/wav');
    return res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Erro na rota TTS POST:', error);
    return res.status(500).json({ error: 'Falha ao sintetizar áudio' });
  }
});

export { AdmRouter };
