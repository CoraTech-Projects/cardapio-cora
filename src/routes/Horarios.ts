import { Router } from 'express';
import { horarios } from '../utils/tempManage.js';

const HorariosRouter = Router();

HorariosRouter.get('/', async (req: any, res: any) => {
  const horarios_1 = horarios.all();
  if (horarios_1) {
    res.status(200).json({
      status: 'success',
      horarios: horarios_1,
    });
  } else {
    res.status(404).json({ error: 'Horários não encontrados' });
  }
});

HorariosRouter.get('/:dia', async (req: any, res: any) => {
  const dia = req.params.dia.toLowerCase();
  const horario_dia = horarios.get(dia);
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

HorariosRouter.post('/:dia', async (req: any, res: any) => {
  const dia = req.params.dia.toLowerCase();
  const { entrada, saida, horario_lanche, periodo, horario_especial } =
    req.body;
  if (!entrada || !saida || !horario_lanche || !periodo) {
    return res.status(400).json({
      error: 'Campos obrigatórios: entrada, saida, horario_lanche, periodo',
    });
  }
  const novoHorario = {
    entrada,
    saida,
    horario_lanche,
    periodo,
    horario_especial: horario_especial || null,
  };
  horarios.insert(dia, novoHorario);
  res.status(200).json({
    status: 'success',
    message: `Horário atualizado para o dia ${dia}`,
    horario: novoHorario,
  });
});

export { HorariosRouter };
