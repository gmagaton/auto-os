// Detecta o hostname atual (localhost ou IP da rede)
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const environment = {
  production: false,
  apiUrl: `http://${hostname}:3000/api`,
};
