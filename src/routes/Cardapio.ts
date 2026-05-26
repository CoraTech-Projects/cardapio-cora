import express from "express";
import { db } from "../app.js";

const CardapioRouter = express.Router();

CardapioRouter.get("/cardapio", async (req: any, res: any) => {

    const cardapio = db.all();
    if (cardapio) {
        res.status(200).json({
            status: "success",
            cardapio
        });
    }   else {
        res.status(404).json({ error: "Cardápio não encontrado" });
    }
});

CardapioRouter.put("/update-cardapio", async (req: any, res: any) => {
    const { dia, prato, acompanhamento, sobremesa } = req.body; 

    if(!db.has(dia)) {
        res.status(404).json({ error: "Dia não encontrado no cardápio" });
        return;
    }

        const updatedCardapio ={
            prato: prato || db.get(dia)?.prato,
            acompanhamento: acompanhamento || db.get(dia)?.acompanhamento,
            sobremesa: sobremesa || db.get(dia)?.sobremesa
        };

        db.update(dia, "", updatedCardapio);
        res.status(200).json({ message: "Cardápio atualizado com sucesso", cardapio: db.get(dia) });
});

CardapioRouter.post("/inserir-cardapio", async (req: any, res: any) => {
    const { dia, prato, acompanhamento, sobremesa } = req.body;
    if (!dia || !prato || !acompanhamento || !sobremesa) {
        res.status(400).json({ error: "Todos os campos são obrigatórios" });
        return;
    }
    if (db.has(dia)) {
        res.status(409).json({ error: "Dia já existe no cardápio" });
        return;
    }
    const newCardapio = {
        prato,
        acompanhamento,
        sobremesa
    };
    db.insert(dia, newCardapio);
    res.status(201).json({ message: "Cardápio inserido com sucesso", cardapio: newCardapio });
});

CardapioRouter.delete("/delete-cardapio", async (req: any, res: any) => {
    const { dia } = req.body;
    if (!dia) {
        res.status(400).json({ error: "Campo 'dia' é obrigatório" });
        return;
    }   
    if (!db.has(dia)) {
        res.status(404).json({ error: "Dia não encontrado no cardápio" });
        return;
    }
    db.delete(dia);
    res.status(200).json({ message: "Cardápio deletado com sucesso" });
});

export { CardapioRouter };