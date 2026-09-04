import express from 'express';
import { db } from '../structures/db.js';

const CardapioRouter = express.Router();
const CARDAPIO_COLLECTION = 'cardapio';

CardapioRouter.get('/', async (req: any, res: any) => {
  const cardapio = db.get(CARDAPIO_COLLECTION);
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  const horarioHoje = db.get("rotinas")[0][hoje];

  if (cardapio) {
    res.status(200).json({
      status: 'success',
      rotina: horarioHoje,
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

CardapioRouter.get('/sync', async (req: any, res: any) => {
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  const horasEMinutos = (() => {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}`;
  })();
  const db_COLLECTION = 'rotinas ';
  const horarioHoje = db.get("rotinas")[0][hoje];

  if (!horarioHoje || typeof horarioHoje !== 'object') {
    res.status(404).json({ error: `No routines to ${db_COLLECTION + hoje}` });
    return;
  }

  const cardapioHoje = db.get('cardapio')?.find((x: any) => x.dia == hoje) || {};

  if (!cardapioHoje || typeof cardapioHoje !== 'object') {
    res.status(404).json({ error: `no routines to ${hoje}` });
    return;
  }

  if (!horarioHoje.find((x:any)=>x.horario_lanche == horasEMinutos)) return res.status(201).json({ status: 201 });

  const responseData = {
    horario: horarioHoje,
    cardapio: cardapioHoje,
  };

  res.status(200).json(responseData);
});

export { CardapioRouter };
