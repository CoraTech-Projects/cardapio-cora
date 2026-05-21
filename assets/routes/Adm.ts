import { Router } from "express";
import { generateTTS } from "../IA/Algorithm.js";

const AdmRouter = Router();

AdmRouter.get("/tts/:text", async (req: any, res: any) => {
    const ttsText = req.params.text || "Olá, este é um teste de texto para fala.";

    const audioBuffer = await generateTTS(ttsText);
 
    res.setHeader("Content-Type", "audio/wav");
    res.send(Buffer.from(audioBuffer));
    console.log("Audio buffer sent successfully.");
});

AdmRouter.get("/chatbot/:message", async (req: any, res: any) => {
    const message = req.params.message || "Olá, este é um teste de mensagem para o chatbot.";

    // Simulate a response from the chatbot (replace this with actual chatbot logic)
    const chatbotResponse = `Você disse: ${message}`;

    res.status(200).json({ response: chatbotResponse });
});

AdmRouter.get("/sinteseIA/:text", async (req: any, res: any) => {
    const text = req.params.text || "Olá, este é um teste de síntese de IA.";
    const audioBuffer = await generateTTS(text);

    res.setHeader("Content-Type", "audio/wav");
    res.send(Buffer.from(audioBuffer));
    console.log("Audio buffer sent successfully.");
});

export { AdmRouter };