import { Router } from 'express';
import { generateTTS } from '../IA/Algorithm.js';
import { horarios } from '../utils/tempManage.js';

const AdmRouter = Router();

AdmRouter.get('/', (req: any, res: any) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/user/login');
  res.sendFile('admin.html', { root: './src/public/_ADMIN' });
});

AdmRouter.get('/tts/:text', async (req: any, res: any) => {
  const ttsText = req.params.text;
  const audioBuffer = await generateTTS(ttsText);

  res.setHeader('Content-Type', 'audio/wav');
  res.send(Buffer.from(audioBuffer));
  console.log(
    '\x1b[34m [ TTS ]: \x1b[0m Áudio gerado e enviado com sucesso para o texto'
  );
});

AdmRouter.get('/chatbot/:message', async (req: any, res: any) => {
  const message = req.params.message;
  const chatbotResponse = `Você disse: ${message}`;

  res.status(200).json({ response: chatbotResponse });
});

AdmRouter.get('/rotinas', (req: any, res: any) => {
  const rotinas = horarios.all();

  if (!req.cookies.token)
    return res.status(401).json({ message: 'sem token de autorizacao' });

  if (rotinas.length < 0)
    return res.status(201).json({ message: 'sem rotinas' });

  return res.status(200).json({
    message: rotinas,
  });
});

AdmRouter.get('/sinteseIA/:text', async (req: any, res: any) => {});

export { AdmRouter };
