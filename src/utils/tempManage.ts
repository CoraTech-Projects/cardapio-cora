import cron from 'node-cron';
import db from './../structures/Database.js';

/**
 * Gerenciamento de tarefas temporárias usando cron. Este módulo permite agendar tarefas para serem executadas em horários específicos, como limpeza de dados antigos, envio de notificações ou outras operações periódicas.
 */

const horarios = new db.Database('horarios.data', true);
const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
const horarioHoje = horarios.get(hoje);

function convertToCron(timeString: string): string {
  const [hora, minuto] = timeString.split(':');
  return `${minuto} ${hora} * * *`;
}

const entries = Object.entries(horarioHoje);

entries.forEach(([key, data]: [string, any]) => {
  cron.schedule(convertToCron(data.entrada), () => {
    console.log(
      `\x1b[32m [ TAREFA ]: \x1b[0m Início do período ${data.periodo} - ${hoje} (${data.entrada})`
    );
  });

  cron.schedule(convertToCron(data.saida), () => {
    console.log(
      `\x1b[31m [ TAREFA ]: \x1b[0m Fim do período ${data.periodo} - ${hoje} (${data.saida})`
    );
  });

  cron.schedule(convertToCron(data.horario_lanche), () => {
    console.log(
      `\x1b[33m [ TAREFA ]: \x1b[0m Lanche do período ${data.periodo} - ${hoje} (${data.horario_lanche})`
    );
  });

  if (data.horario_especial && data.horario_especial.horario) {
    cron.schedule(convertToCron(data.horario_especial.horario), () => {
      console.log(
        `\x1b[35m [ TAREFA ]: \x1b[0m Evento especial do período ${data.periodo} - ${hoje}: ${data.horario_especial.descricao}`
      );
    });
  }
});

export { horarios };
