import { Router, Request, Response } from 'express';
import { db } from '../structures/db.js';
import { requireAuth } from '../middlawere/OAuth.js';

const RotinasRouter = Router();
const ROTINAS_COLLECTION = 'rotinas';

function sanitizeText(value: any): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '') // remove tags HTML
    .trim();
}

interface RoutineRequestBody {
  periodo: string;
  dia: string;
}

RotinasRouter.get('/', async (req: any, res: any) => {
  const horarios = db.get(ROTINAS_COLLECTION);
  if (horarios) {
    return res.status(200).json({
      status: 'success',
      rotinas: horarios,
    });
  } else {
    return res.status(404).json({ error: 'Rotinas não encontradas' });
  }
});

RotinasRouter.get('/:dia', async (req: any, res: any) => {
  const dia = sanitizeText(req.params.dia).toLowerCase();

  const horario_dia = db.get(ROTINAS_COLLECTION)?.[0]?.[dia];
  if (horario_dia) {
    return res.status(200).json({
      status: 'success',
      horario: horario_dia,
    });
  } else {
    return res
      .status(404)
      .json({ error: 'Horário não encontrado para o dia especificado' });
  }
});

RotinasRouter.post('/update-rotina', requireAuth, async (req: any, res: any) => {
  const routineUpdateObject: Record<string, any> = req.body;
  const dia = sanitizeText(routineUpdateObject.dia).toLowerCase();
  const periodo = sanitizeText(routineUpdateObject.periodo).toLowerCase();

  if (!dia || !db.has(`${ROTINAS_COLLECTION}.${dia}`)) {
    return res.status(404).json({ error: 'Dia não encontrado nas rotinas' });
  }

  const dayArr: any[] = db.get(ROTINAS_COLLECTION)?.[0]?.[dia] || [];
  const routineIndex = dayArr.findIndex(
    (r: any) => r.periodo.toLowerCase() === periodo
  );

  if (routineIndex === -1) {
    return res.status(404).json({ error: 'Período não encontrado para este dia' });
  }

  // Sanitiza todos os campos de texto enviados
  const fieldsToSanitize = [
    'entrada',
    'saida',
    'horario_lanche',
    'mensagem_boas_vindas',
    'mensagem_destaque',
    'mensagem_aviso',
    'mensagem_coordenacao',
  ];

  fieldsToSanitize.forEach((key: string) => {
    if (routineUpdateObject[key] !== undefined) {
      const sanitizedVal = sanitizeText(routineUpdateObject[key]);
      db.update(
        ROTINAS_COLLECTION,
        `${dia}.${routineIndex}.${key}`,
        sanitizedVal
      );
    }
  });

  return res.status(200).json({
    message: 'Rotina atualizada com sucesso',
    rotina: db.get(ROTINAS_COLLECTION)?.[0]?.[dia]?.[routineIndex],
  });
});

RotinasRouter.put('/inserir-rotina', requireAuth, async (req: any, res: any) => {
  const dia = sanitizeText(req.body.dia).toLowerCase();
  if (!dia) return res.status(400).json({ error: 'Dia é obrigatório' });

  const sanitizedRoutine = {
    dia,
    periodo: sanitizeText(req.body.periodo).toLowerCase(),
    entrada: sanitizeText(req.body.entrada),
    saida: sanitizeText(req.body.saida),
    horario_lanche: sanitizeText(req.body.horario_lanche),
    horario_especial: {},
    mensagem_boas_vindas: sanitizeText(req.body.mensagem_boas_vindas),
    mensagem_destaque: sanitizeText(req.body.mensagem_destaque),
    mensagem_aviso: sanitizeText(req.body.mensagem_aviso),
    mensagem_coordenacao: sanitizeText(req.body.mensagem_coordenacao),
  };

  const dayRoutineContent: any[] = db.get(ROTINAS_COLLECTION)?.[0]?.[dia] || [];
  dayRoutineContent.push(sanitizedRoutine);
  db.update(ROTINAS_COLLECTION, `${dia}`, dayRoutineContent);

  return res.status(200).json({
    status: 'success',
    message: `Horário atualizado para o dia ${dia}`,
    horario: dia,
  });
});

RotinasRouter.delete(
  '/delete-rotina',
  requireAuth,
  (req: Request<{}, {}, RoutineRequestBody>, res: Response) => {
    const dia = sanitizeText(req.body.dia).toLowerCase();
    const periodo = sanitizeText(req.body.periodo).toLowerCase();

    if (!periodo || !dia) {
      return res
        .status(400)
        .json({ message: 'Período e dia são obrigatórios.', status: 400 });
    }

    const dayRoutineContent: any[] =
      db.get(ROTINAS_COLLECTION)?.[0]?.[dia] || [];
    if (!dayRoutineContent) {
      return res
        .status(404)
        .json({ message: 'Este dia não existe.', status: 404 });
    }

    const routineIndex = dayRoutineContent.findIndex(
      (x: any) => x.periodo.toLowerCase() === periodo
    );

    if (routineIndex === -1) {
      return res
        .status(404)
        .json({ message: 'Rotina não encontrada para este dia.', status: 404 });
    }

    const [routineRemoved] = dayRoutineContent.splice(routineIndex, 1);

    if (dayRoutineContent.length === 0) {
      db.delete(ROTINAS_COLLECTION, `${dia}`);
    } else {
      db.update(ROTINAS_COLLECTION, dia, dayRoutineContent);
    }

    return res.status(200).json({
      message: 'Removido com sucesso',
      rotina: routineRemoved,
    });
  }
);

export { RotinasRouter };
