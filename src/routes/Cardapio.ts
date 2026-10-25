import express from 'express';
import { db } from '../structures/db.js';
import { requireAuth } from '../middlawere/OAuth.js';

const CardapioRouter = express.Router();
const CARDAPIO_COLLECTION = 'cardapio';

/**
 * Função de sanitização contra XSS e injeção de HTML
 */
function sanitizeText(value: any): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '') // remove tags HTML
    .trim();
}

CardapioRouter.get('/', async (req: any, res: any) => {
  const cardapio = db.get(CARDAPIO_COLLECTION);
  const allCardapio = req.query.all === 'true';
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  const rotinas = db.get('rotinas');
  const horarioHoje = rotinas && rotinas[0] ? rotinas[0][hoje] : null;

  const saberTurno = () => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) return 'manhã';
    else if (hours >= 12 && hours < 18) return 'tarde';
    return 'noite';
  };

  if (allCardapio) {
    return res.status(200).json({
      status: 'success',
      cardapio: cardapio,
    });
  } else if (cardapio) {
    const isDemo = req.query.demo === 'true';
    const diaUtil = !['sábado', 'sabado', 'domingo'].includes(hoje.toLowerCase());
    const cardapioHoje =
      cardapio.find((x: Record<string, any>) => x.dia.toLowerCase() == hoje.toLowerCase()) ||
      (isDemo && Array.isArray(cardapio) && cardapio.length > 0
        ? cardapio[0]
        : null);

    const horarioData = horarioHoje || (isDemo && rotinas && rotinas[0] ? rotinas[0]['segunda-feira'] : null);
    const rotinaTurno =
      horarioData?.find((x: Record<string, any>) => x.periodo == saberTurno()) ||
      (isDemo && horarioData && horarioData.length > 0 ? horarioData[0] : null);

    return res.status(200).json({
      status: 'success',
      diaUtil,
      rotina: rotinaTurno,
      cardapio: cardapioHoje,
      settings: db.get('settings'),
    });
  } else {
    return res.status(404).json({ error: 'Cardápio não encontrado' });
  }
});

CardapioRouter.post('/update-cardapio', requireAuth, async (req: any, res: any) => {
  const { dia, prato, acompanhamento, especial, description } = req.body;
  const cleanDia = sanitizeText(dia);

  if (!cleanDia || !db.has(`${CARDAPIO_COLLECTION}.${cleanDia}`)) {
    return res.status(404).json({ error: 'Dia não encontrado no cardápio' });
  }

  const existingCardapio = db.get(CARDAPIO_COLLECTION)?.[cleanDia] || {};
  const updatedCardapio: any = {
    prato: prato !== undefined ? sanitizeText(prato) : existingCardapio.prato,
    especial:
      especial !== undefined
        ? String(especial).toLowerCase() === 'true' || especial === true
        : existingCardapio.especial,
    acompanhamento:
      acompanhamento !== undefined
        ? sanitizeText(acompanhamento)
        : existingCardapio.acompanhamento,
    dia: cleanDia,
    description:
      description !== undefined
        ? sanitizeText(description)
        : existingCardapio.description,
  };

  Object.keys(updatedCardapio).forEach((field) =>
    db.update(CARDAPIO_COLLECTION, `${cleanDia}.${field}`, updatedCardapio[field])
  );

  return res.status(200).json({
    message: 'Cardápio atualizado com sucesso',
    cardapio: db.get(CARDAPIO_COLLECTION)?.[cleanDia],
  });
});

CardapioRouter.post('/inserir-cardapio', requireAuth, async (req: any, res: any) => {
  const { dia, prato, acompanhamento, description, especial } = req.body;
  const cleanDia = sanitizeText(dia);
  const cleanPrato = sanitizeText(prato);
  const cleanAcompanhamento = sanitizeText(acompanhamento);
  const cleanDescription = sanitizeText(description);

  if (!cleanDia || !cleanPrato || !cleanAcompanhamento || especial === undefined) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  if (db.has(`${CARDAPIO_COLLECTION}.${cleanDia}`)) {
    return res.status(409).json({ error: 'Dia já existe no cardápio' });
  }

  function generateId(size = 7) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    for (let i = 0; i < size; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
  }

  const newCardapio = {
    prato: cleanPrato,
    acompanhamento: cleanAcompanhamento,
    dia: cleanDia,
    especial: String(especial).toLowerCase() === 'true' || especial === true,
    description: cleanDescription,
    id: generateId(7),
  };

  db.update(CARDAPIO_COLLECTION, cleanDia, newCardapio);
  return res
    .status(201)
    .json({ message: 'Cardápio inserido com sucesso', cardapio: newCardapio });
});

CardapioRouter.delete('/delete-cardapio', requireAuth, async (req: any, res: any) => {
  const { id } = req.body;
  const cleanId = sanitizeText(id);
  if (!cleanId) {
    return res.status(400).json({ error: "Campo 'id' ou 'dia' é obrigatório" });
  }
  if (!db.has(`${CARDAPIO_COLLECTION}.${cleanId}`)) {
    return res.status(404).json({ error: 'Item não encontrado no cardápio' });
  }

  db.delete(CARDAPIO_COLLECTION, cleanId);
  return res.status(200).json({ message: 'Cardápio deletado com sucesso' });
});

CardapioRouter.get('/sync', async (req: any, res: any) => {
  const date = new Date();
  const hoje = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const horasEMinutos = `${horas}:${minutos}`;
  const rotinas = db.get('rotinas');
  const horarioHoje = rotinas && rotinas[0] ? rotinas[0][hoje] : null;

  if (!horarioHoje || typeof horarioHoje !== 'object') {
    return res.status(404).json({ error: `Sem rotinas para ${hoje}` });
  }

  const cardapioHoje =
    db.get('cardapio')?.find((x: any) => x.dia.toLowerCase() == hoje.toLowerCase()) || null;

  if (!cardapioHoje || typeof cardapioHoje !== 'object') {
    return res.status(404).json({ error: `Sem cardápio para ${hoje}` });
  }

  if (!horarioHoje.find((x: any) => x.horario_lanche == horasEMinutos)) {
    return res.status(201).json({ status: 201 });
  }

  const responseData = {
    horario: horarioHoje,
    cardapio: cardapioHoje,
    settings: db.get('settings'),
  };

  return res.status(200).json(responseData);
});

export { CardapioRouter };
