/**
 * Um simples utilitário de logs para o backend.
 * Assim padronizamos a saída no terminal com cores e mantemos uma separação
 * visual legal para lógica de negócios em vez das antigas consultas do banco.
 */

const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m', // Cyan
  success: '\x1b[32m', // Verde
  warn: '\x1b[33m', // Amarelo
  error: '\x1b[31m', // Vermelho
  debug: '\x1b[90m', // Cinza
};

function formatMessage(level: string, color: string, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const metaString = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] ${color}[${level}]${colors.reset} ${message}${metaString}`;
}

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(formatMessage('INFO', colors.info, message, meta));
  },
  success: (message: string, meta?: any) => {
    console.log(formatMessage('SUCCESS', colors.success, message, meta));
  },
  warn: (message: string, meta?: any) => {
    console.warn(formatMessage('WARN', colors.warn, message, meta));
  },
  error: (message: string, error?: any) => {
    console.error(formatMessage('ERROR', colors.error, message, error));
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('DEBUG', colors.debug, message, meta));
    }
  },
};

export default logger;
