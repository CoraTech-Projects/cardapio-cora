import { Router, Request, Response } from 'express';
import { db } from '../structures/db.js';

const RotinasRouter = Router();
const ROTINAS_COLLECTION = 'rotinas';

interface RoutineRequestBody {
  periodo: string;
  dia: string;
}

RotinasRouter.get('/', async (req: any, res: any) => {
  const horarios = db.get(ROTINAS_COLLECTION);
  if (horarios) {
    res.status(200).json({
      status: 'success',
      rotinas: horarios,
    });
  } else {
    res.status(404).json({ error: 'Rotinas não encontradas' });
  }
});

RotinasRouter.get('/:dia', async (req: any, res: any) => {
  const dia = req.params.dia.toLowerCase();
  const horario_dia = db.get(ROTINAS_COLLECTION)?.[dia];
  if (horario_dia) {
    res.status(200).json({
      status: 'success',
      horario: horario_dia,
    });
  } else {
    res
      .status(404)
      .json({ error: 'Horário não encontrado para o dia especificado' });
  }
});

RotinasRouter.post('/update-rotina', async (req: any, res: any) => {
  const routineUpdateObject: Record<string, any> = req.body;

  const dia = routineUpdateObject.dia;
  if (!db.has(`${ROTINAS_COLLECTION}.${dia}`)) {
    res.status(404).json({ error: 'Dia não encontrado nas rotinas' });
    return;
  }

  const dayArr: any[] = db.get(ROTINAS_COLLECTION)?.[dia] || [];
  const routineIndex = dayArr.findIndex(
    (r: any) => r.periodo === routineUpdateObject.periodo
  );

  if (routineIndex === -1) {
    res.status(404).json({ error: 'Período não encontrado para este dia' });
    return;
  }

  Object.keys(routineUpdateObject).forEach((key: string) => {
    if (key === 'dia') return;
    db.update(
      ROTINAS_COLLECTION,
      `${dia}.${routineIndex}.${key}`,
      routineUpdateObject[key]
    );
  });

  res.status(200).json({
    message: 'Rotina atualizada com sucesso',
    rotina: db.get(ROTINAS_COLLECTION)?.[dia]?.[routineIndex],
  });
});

RotinasRouter.put('/inserir-rotina', async (req: any, res: any) => {
  const { dia } = req.body;
  if (!dia) return res.status(400).json({ error: 'Dia é obrigatório' });

  const dayRoutineContent: any[] = db.get(ROTINAS_COLLECTION)?.[dia] || [];
  dayRoutineContent.push(req.body);
  db.update(ROTINAS_COLLECTION, dia, dayRoutineContent);

  res.status(200).json({
    status: 'success',
    message: `Horário atualizado para o dia ${dia}`,
    horario: dia,
  });
});

RotinasRouter.delete(
  '/delete-rotina',
  (req: Request<{}, {}, RoutineRequestBody>, res: Response) => {
    const { periodo, dia } = req.body;

    if (!req.cookies?.token) {
      return res
        .status(401)
        .json({ message: 'Sem autorização necessária.', status: 401 });
    }

    if (!periodo || !dia) {
      return res
        .status(400)
        .json({ message: 'Período e dia são obrigatórios.', status: 400 });
    }

    const dayRoutineContent: any[] = db.get(ROTINAS_COLLECTION)?.[dia];
    if (!dayRoutineContent) {
      return res
        .status(404)
        .json({ message: 'Este dia não existe.', status: 404 });
    }

    const routineIndex = dayRoutineContent.findIndex(
      (x: any) => x.periodo === periodo
    );

    if (routineIndex === -1) {
      return res
        .status(404)
        .json({ message: 'Rotina não encontrada para este dia.', status: 404 });
    }

    const [routineRemoved] = dayRoutineContent.splice(routineIndex, 1);

    if (dayRoutineContent.length === 0) {
      db.delete(ROTINAS_COLLECTION, dia);
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
