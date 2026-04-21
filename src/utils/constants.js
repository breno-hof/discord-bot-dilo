// Cores dos Embeds por estado do jogo
const Colors = {
  LOBBY: 0x3498db,       // Azul - Aguardando jogadores
  IN_GAME: 0xf1c40f,     // Amarelo - Rodada em andamento
  VOTING: 0xe67e22,      // Laranja - Votação
  VICTORY: 0x2ecc71,     // Verde - Vitória dos jogadores
  DEFEAT: 0xe74c3c,      // Vermelho - Vitória do impostor
  INFO: 0x9b59b6,        // Roxo - Informações/Regras
  NEUTRAL: 0x95a5a6,     // Cinza - Neutro
};

// Emojis para interface visual
const Emojis = {
  GAME: '🎭',
  IMPOSTOR: '🕵️',
  PLAYER: '👤',
  PLAYERS: '👥',
  CROWN: '👑',
  VOTE: '🗳️',
  CHECK: '✅',
  CROSS: '❌',
  STAR: '⭐',
  TROPHY: '🏆',
  CLOCK: '⏰',
  LOCK: '🔒',
  UNLOCK: '🔓',
  QUESTION: '❓',
  MEGAPHONE: '📢',
  SCROLL: '📜',
  FIRE: '🔥',
  SHIELD: '🛡️',
  TARGET: '🎯',
  SPARKLE: '✨',
  WARNING: '⚠️',
  HOURGLASS: '⏳',
  CONFETTI: '🎉',
  SKULL: '💀',
  EYE: '👁️',
  DM: '📩',
  SETTINGS: '⚙️',
  CHART: '📊',
};

// Configurações do jogo
const GameConfig = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 15,
  LOBBY_TIMEOUT: 120_000,       // 2 minutos para lobby
  VOTING_TIMEOUT: 60_000,       // 1 minuto para votação
  ANSWER_TIMEOUT: 90_000,       // 1.5 minuto para responder
  ROUND_DELAY: 3_000,           // 3 segundos entre fases
};

module.exports = { Colors, Emojis, GameConfig };
