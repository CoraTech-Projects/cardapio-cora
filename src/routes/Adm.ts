import { Router } from "express";
import { generateTTS } from "../IA/Algorithm.js";

const AdmRouter = Router();

AdmRouter.get("/tts/:text", async (req: any, res: any) => {
    const ttsText = req.params.text;
    const audioBuffer = await generateTTS(ttsText);
 
    res.setHeader("Content-Type", "audio/wav");
    res.send(Buffer.from(audioBuffer));
    console.log("\x1b[34m [ TTS ]: \x1b[0m Áudio gerado e enviado com sucesso para o texto");
});

AdmRouter.get("/chatbot/:message", async (req: any, res: any) => {
    const message = req.params.message;
    const chatbotResponse = `Você disse: ${message}`;

    res.status(200).json({ response: chatbotResponse });
});

AdmRouter.get("/sinteseIA/:text", async (req: any, res: any) => {
    
});

export { AdmRouter };