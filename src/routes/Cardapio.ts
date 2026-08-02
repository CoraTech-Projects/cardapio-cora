import express from 'express';
import { db } from '../structures/db.js';

const CardapioRouter = express.Router();
const CARDAPIO_COLLECTION = 'cardapio';

CardapioRouter.get('/', async (req: any, res: any) => {
  const cardapio = db.get(CARDAPIO_COLLECTION);

  if (cardapio) {
    res.status(200).json({
      status: 'success',
      cardapio: cardapio,
    });
  } else {
    res.status(404).json({ error: 'Cardápio não encontrado' });
  }
});

CardapioRouter.post('/update-cardapio', async (req: any, res: any) => {
  console.log(req.body);
  const { dia, prato, acompanhamento, especial, description } = req.body;

  if (!db.has(`${CARDAPIO_COLLECTION}.${dia}`)) {
    res.status(404).json({ error: 'Dia não encontrado no cardápio' });
    return;
  }

  const existingCardapio = db.get(CARDAPIO_COLLECTION)?.[dia] || {};
  const updatedCardapio: any = {
    prato: prato ?? existingCardapio.prato,
    especial: especial ?? existingCardapio.especial,
    acompanhamento: acompanhamento ?? existingCardapio.acompanhamento,
    dia: dia ?? existingCardapio.dia,
    description: description ?? existingCardapio.description,
  };

  Object.keys(updatedCardapio).forEach((field) =>
    db.update(CARDAPIO_COLLECTION, `${dia}.${field}`, updatedCardapio[field])
  );

  res.status(200).json({
    message: 'Cardápio atualizado com sucesso',
    cardapio: db.get(CARDAPIO_COLLECTION)?.[dia],
  });
});

CardapioRouter.post('/inserir-cardapio', async (req: any, res: any) => {
  const { dia, prato, acompanhamento, description, especial } = req.body;
  if (!dia || !prato || !acompanhamento || especial === undefined) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    return;
  }

  if (db.has(`${CARDAPIO_COLLECTION}.${dia}`)) {
    res.status(409).json({ error: 'Dia já existe no cardápio' });
    return;
  }

  function gerateId(size = 6) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';

    for (let i = 0; i < size; i++) {
      const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
      resultado += caracteres.charAt(indiceAleatorio);
    }

    return resultado;
  }

  const newCardapio = {
    prato,
    acompanhamento,
    dia,
    especial,
    description,
    id: gerateId(7),
  };

  console.log(newCardapio);
  db.update(CARDAPIO_COLLECTION, dia, newCardapio);
  res
    .status(201)
    .json({ message: 'Cardápio inserido com sucesso', cardapio: newCardapio });
});

CardapioRouter.delete('/delete-cardapio', async (req: any, res: any) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ error: "Campo 'dia' é obrigatório" });
    return;
  }
  if (!db.has(`${CARDAPIO_COLLECTION}.${id}`)) {
    res.status(404).json({ error: 'Dia não encontrado no cardápio' });
    return;
  }

  db.delete(CARDAPIO_COLLECTION, id);
  res.status(200).json({ message: 'Cardápio deletado com sucesso' });
});

export { CardapioRouter };
