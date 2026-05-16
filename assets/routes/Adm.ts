import { Router } from "express";
import { generate } from "../IA/Algorithm.js";
import path from "path";
import { db } from "../app.js";

const AdmRouter = Router();

AdmRouter.get("/tts/:text", async (req: any, res: any) => {
    const ttsText = req.params.text || "Olá, este é um teste de texto para fala.";

    const audioBuffer = await generate(ttsText);

    res.setHeader("Content-Type", "audio/wav");
    res.send(Buffer.from(audioBuffer));
    console.log("Audio buffer sent successfully.");
});

AdmRouter.get("/cardapio", async (req: any, res: any) => {
    const cardapio = db.get("cardapio");
    if (cardapio) {
        res.json(cardapio);
    }   else {
        res.status(404).json({ error: "Cardápio não encontrado" });
    }
});

AdmRouter.put("/update-cardapio", async (req: any, res: any) => {
    
});

AdmRouter.post("/gerar-cardapio", async (req: any, res: any) => {
    
});

AdmRouter.delete("/delete-cardapio", async (req: any, res: any) => {

});
export { AdmRouter };