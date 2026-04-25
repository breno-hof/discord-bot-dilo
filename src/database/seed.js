/**
 * seed.js — Popula o banco PostgreSQL com as duplas de perguntas.
 *
 * Uso:
 *   DATABASE_URL=postgres://... node src/database/seed.js
 *   ou configure env.json com DB_HOST, DB_USER, etc.
 *
 * O script é idempotente: usa INSERT ... ON CONFLICT DO NOTHING
 * para não duplicar perguntas em execuções repetidas.
 * Para forçar uma recarga completa, passe --reset como argumento.
 */

const { Pool } = require('pg');
const { readFileSync, existsSync } = require('fs');
const path = require('path');

// ==========================================
// Configuração de conexão
// ==========================================

function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false };
  }

  const envPath = path.resolve(__dirname, '../../env.json');
  if (existsSync(envPath)) {
    const config = JSON.parse(readFileSync(envPath, 'utf-8'));
    if (config.DATABASE_URL) {
      return { connectionString: config.DATABASE_URL, ssl: config.DB_SSL === 'true' ? { rejectUnauthorized: false } : false };
    }
    return {
      host:     config.DB_HOST     || 'localhost',
      port:     parseInt(config.DB_PORT || '5432', 10),
      database: config.DB_NAME     || 'dilo',
      user:     config.DB_USER     || 'dilo',
      password: config.DB_PASSWORD || '',
    };
  }

  // Fallback para desenvolvimento local padrão
  return { host: 'localhost', port: 5432, database: 'dilo', user: 'dilo', password: '' };
}

// ==========================================
// 249 duplas de perguntas
// ==========================================

const pairs = [
  // ===== COMIDA E BEBIDA (1-30) =====
  ["Qual sua fruta favorita?", "Qual sua sobremesa favorita?", "comida"],
  ["Qual seu prato preferido no almoço?", "Qual seu prato preferido no jantar?", "comida"],
  ["Qual refrigerante você mais gosta?", "Qual suco você mais gosta?", "comida"],
  ["Qual seu sabor de pizza favorito?", "Qual seu sabor de sorvete favorito?", "comida"],
  ["Qual comida de rua você mais gosta?", "Qual comida caseira você mais gosta?", "comida"],
  ["Qual seu café da manhã ideal?", "Qual seu lanche da tarde ideal?", "comida"],
  ["Qual tempero você mais usa na cozinha?", "Qual molho você mais usa na cozinha?", "comida"],
  ["Qual doce de festa junina você prefere?", "Qual comida de festa junina você prefere?", "comida"],
  ["Qual tipo de carne você mais gosta?", "Qual tipo de salada você mais gosta?", "comida"],
  ["Qual chá você mais gosta de tomar?", "Qual café você mais gosta de tomar?", "comida"],
  ["Qual comida japonesa você prefere?", "Qual comida italiana você prefere?", "comida"],
  ["Qual seu sabor de bolo favorito?", "Qual seu sabor de torta favorito?", "comida"],
  ["Qual petisco você come no cinema?", "Qual petisco você come em casa?", "comida"],
  ["Qual queijo você mais gosta?", "Qual pão você mais gosta?", "comida"],
  ["Qual comida você pediria como última refeição?", "Qual comida você nunca mais comeria?", "comida"],
  ["Qual bebida quente você prefere no inverno?", "Qual bebida gelada você prefere no verão?", "comida"],
  ["Qual seu recheio de sanduíche favorito?", "Qual seu recheio de pastel favorito?", "comida"],
  ["Qual massa você mais gosta?", "Qual arroz você mais gosta?", "comida"],
  ["Qual vegetal você mais gosta de comer?", "Qual vegetal você menos gosta de comer?", "comida"],
  ["Qual fast food é seu favorito?", "Qual restaurante fino é seu favorito?", "comida"],
  ["Qual comida de aniversário você prefere?", "Qual comida de Natal você prefere?", "comida"],
  ["Qual sabor de chips você mais gosta?", "Qual sabor de biscoito você mais gosta?", "comida"],
  ["Qual sopa você mais gosta?", "Qual caldo você mais gosta?", "comida"],
  ["Qual comida mexicana você prefere?", "Qual comida chinesa você prefere?", "comida"],
  ["Qual sua vitamina de fruta favorita?", "Qual seu milkshake favorito?", "comida"],
  ["Qual comida de boteco você mais pede?", "Qual comida de padaria você mais pede?", "comida"],
  ["Qual molho de salada você prefere?", "Qual tempero de churrasco você prefere?", "comida"],
  ["Qual cereal matinal você mais gosta?", "Qual granola ou barra você mais gosta?", "comida"],
  ["Qual comida congelada você mais compra?", "Qual comida delivery você mais pede?", "comida"],
  ["Qual sobremesa de restaurante você sempre pede?", "Qual entrada de restaurante você sempre pede?", "comida"],

  // ===== ENTRETENIMENTO (31-60) =====
  ["Qual seu filme favorito?", "Qual sua série favorita?", "entretenimento"],
  ["Qual gênero de música você mais ouve?", "Qual gênero de filme você mais assiste?", "entretenimento"],
  ["Qual seu jogo de videogame favorito?", "Qual seu jogo de tabuleiro favorito?", "entretenimento"],
  ["Qual seu cantor favorito?", "Qual sua banda favorita?", "entretenimento"],
  ["Qual seu programa de TV favorito da infância?", "Qual seu desenho animado favorito da infância?", "entretenimento"],
  ["Qual livro marcou sua vida?", "Qual filme marcou sua vida?", "entretenimento"],
  ["Qual plataforma de streaming você mais usa?", "Qual rede social você mais usa?", "entretenimento"],
  ["Qual seu super-herói favorito?", "Qual seu vilão favorito?", "entretenimento"],
  ["Qual tipo de podcast você mais ouve?", "Qual tipo de canal do YouTube você mais assiste?", "entretenimento"],
  ["Qual seu personagem de anime favorito?", "Qual seu personagem de filme favorito?", "entretenimento"],
  ["Qual console de videogame você prefere?", "Qual marca de celular você prefere?", "entretenimento"],
  ["Qual música você ouviria em loop?", "Qual música você não aguenta mais ouvir?", "entretenimento"],
  ["Qual seu ator favorito?", "Qual sua atriz favorita?", "entretenimento"],
  ["Qual reality show você mais gosta?", "Qual programa de auditório você mais gosta?", "entretenimento"],
  ["Qual seu gênero de livro favorito?", "Qual seu gênero de jogo favorito?", "entretenimento"],
  ["Qual seu filme de comédia favorito?", "Qual seu filme de terror favorito?", "entretenimento"],
  ["Qual sua música para dançar?", "Qual sua música para relaxar?", "entretenimento"],
  ["Qual seu youtuber favorito?", "Qual seu streamer favorito?", "entretenimento"],
  ["Qual seu app de jogo favorito no celular?", "Qual seu app favorito no celular?", "entretenimento"],
  ["Qual série você reassistiria do zero?", "Qual filme você reassistiria do zero?", "entretenimento"],
  ["Qual seu documentário favorito?", "Qual sua animação favorita?", "entretenimento"],
  ["Qual instrumento musical você gostaria de tocar?", "Qual idioma você gostaria de falar?", "entretenimento"],
  ["Qual festival de música você iria?", "Qual evento esportivo você iria?", "entretenimento"],
  ["Qual seu personagem de jogo favorito?", "Qual seu personagem de série favorito?", "entretenimento"],
  ["Qual seu álbum de música favorito?", "Qual sua trilha sonora de filme favorita?", "entretenimento"],
  ["Qual quadrinho ou mangá você mais gosta?", "Qual graphic novel você mais gosta?", "entretenimento"],
  ["Qual jogo de cartas você mais gosta?", "Qual jogo de festa você mais gosta?", "entretenimento"],
  ["Qual seu comediante favorito?", "Qual seu apresentador de TV favorito?", "entretenimento"],
  ["Qual seu filme da Disney favorito?", "Qual seu filme da Pixar favorito?", "entretenimento"],
  ["Qual karaokê você sempre canta?", "Qual música você canta no chuveiro?", "entretenimento"],

  // ===== VIAGEM E LUGARES (61-85) =====
  ["Qual país você mais quer visitar?", "Qual cidade do Brasil você mais quer visitar?", "viagem"],
  ["Qual praia é sua favorita?", "Qual montanha é sua favorita?", "viagem"],
  ["Qual seu meio de transporte favorito?", "Qual seu tipo de viagem favorito?", "viagem"],
  ["Qual lugar você visitaria de novo?", "Qual lugar você nunca mais voltaria?", "viagem"],
  ["Qual hotel dos sonhos você ficaria?", "Qual tipo de hospedagem você prefere?", "viagem"],
  ["Qual parque temático você mais quer ir?", "Qual museu você mais quer visitar?", "viagem"],
  ["Qual cidade grande você moraria?", "Qual cidade pequena você moraria?", "viagem"],
  ["Qual destino de lua de mel você escolheria?", "Qual destino de férias em família você escolheria?", "viagem"],
  ["Qual comida típica de viagem você mais gostou?", "Qual souvenir de viagem você mais gostou?", "viagem"],
  ["Qual aeroporto você mais gosta?", "Qual estação de trem você mais gosta?", "viagem"],
  ["Qual seu lugar favorito na sua cidade?", "Qual seu lugar favorito para passear?", "viagem"],
  ["Qual país da Europa você visitaria primeiro?", "Qual país da Ásia você visitaria primeiro?", "viagem"],
  ["Qual aventura ao ar livre você faria?", "Qual esporte radical você faria?", "viagem"],
  ["Qual resort você gostaria de ir?", "Qual camping você gostaria de ir?", "viagem"],
  ["Qual cruzeiro marítimo você faria?", "Qual road trip você faria?", "viagem"],
  ["Qual ponto turístico do Brasil você mais gosta?", "Qual ponto turístico do mundo você mais gosta?", "viagem"],
  ["Qual clima você prefere para viajar?", "Qual estação do ano você prefere para viajar?", "viagem"],
  ["Qual ilha paradisíaca você visitaria?", "Qual deserto famoso você visitaria?", "viagem"],
  ["Qual feira ou mercado de rua você mais gostou?", "Qual shopping center você mais gostou?", "viagem"],
  ["Qual trilha na natureza você faria?", "Qual passeio de barco você faria?", "viagem"],
  ["Qual cidade histórica você visitaria?", "Qual cidade futurista você visitaria?", "viagem"],
  ["Qual zoológico ou aquário você mais gosta?", "Qual jardim botânico você mais gosta?", "viagem"],
  ["Qual viagem de trem cênica você faria?", "Qual viagem de balão você faria?", "viagem"],
  ["Qual festival cultural você gostaria de ir?", "Qual carnaval do mundo você gostaria de ir?", "viagem"],
  ["Qual maravilha do mundo você quer ver?", "Qual patrimônio da UNESCO você quer ver?", "viagem"],

  // ===== VIDA PESSOAL (86-115) =====
  ["Qual seu hobby favorito?", "Qual hobby você gostaria de começar?", "pessoal"],
  ["Qual sua cor favorita?", "Qual cor você menos gosta?", "pessoal"],
  ["Qual seu animal de estimação favorito?", "Qual animal selvagem você mais admira?", "pessoal"],
  ["Qual sua estação do ano favorita?", "Qual mês do ano é seu favorito?", "pessoal"],
  ["Qual superpoder você teria?", "Qual habilidade especial você teria?", "pessoal"],
  ["Qual profissão você teria se não fosse a atual?", "Qual profissão você nunca teria?", "pessoal"],
  ["Qual seu maior medo?", "Qual sua maior coragem?", "pessoal"],
  ["Qual seu dia da semana favorito?", "Qual horário do dia é seu favorito?", "pessoal"],
  ["Qual matéria da escola você mais gostava?", "Qual matéria da escola você menos gostava?", "pessoal"],
  ["Qual cheiro você mais gosta?", "Qual som você mais gosta?", "pessoal"],
  ["Qual sua roupa favorita para usar?", "Qual acessório você sempre usa?", "pessoal"],
  ["Qual presente você mais gostou de receber?", "Qual presente você mais gostou de dar?", "pessoal"],
  ["Qual seu maior sonho?", "Qual sua maior conquista?", "pessoal"],
  ["Qual celebridade você gostaria de conhecer?", "Qual pessoa histórica você gostaria de conhecer?", "pessoal"],
  ["Qual hábito bom você tem?", "Qual hábito ruim você tem?", "pessoal"],
  ["Qual sua frase motivacional favorita?", "Qual conselho você sempre dá?", "pessoal"],
  ["Qual seu tipo de festa favorito?", "Qual sua comemoração favorita?", "pessoal"],
  ["Qual talento escondido você tem?", "Qual talento você gostaria de ter?", "pessoal"],
  ["Qual sua memória favorita da infância?", "Qual sua memória favorita recente?", "pessoal"],
  ["Qual seu esporte favorito para assistir?", "Qual seu esporte favorito para praticar?", "pessoal"],
  ["Qual sua flor favorita?", "Qual sua árvore favorita?", "pessoal"],
  ["Qual seu perfume favorito?", "Qual seu sabonete favorito?", "pessoal"],
  ["Qual rede social você mais gosta?", "Qual rede social você menos gosta?", "pessoal"],
  ["Qual tipo de clima você prefere?", "Qual tipo de paisagem você prefere?", "pessoal"],
  ["Qual seu emoji favorito?", "Qual sua figurinha favorita?", "pessoal"],
  ["Qual seu aplicativo mais usado?", "Qual seu site mais acessado?", "pessoal"],
  ["Qual sua bebida alcoólica favorita?", "Qual sua bebida não alcoólica favorita?", "pessoal"],
  ["Qual seu tipo de humor favorito?", "Qual piada você sempre conta?", "pessoal"],
  ["Qual seu lema de vida?", "Qual sua palavra favorita?", "pessoal"],
  ["Qual tradição familiar você mais gosta?", "Qual tradição de Natal você mais gosta?", "pessoal"],

  // ===== HIPOTÉTICOS E DILEMAS (116-145) =====
  ["Se pudesse viajar no tempo, iria ao passado ou futuro?", "Se pudesse teletransportar, iria para qual lugar?", "hipotetico"],
  ["Se ganhasse na loteria, o que faria primeiro?", "Se tivesse um dia sem consequências, o que faria?", "hipotetico"],
  ["Se fosse um animal, qual seria?", "Se fosse uma planta, qual seria?", "hipotetico"],
  ["Se pudesse jantar com alguém famoso, quem seria?", "Se pudesse trabalhar com alguém famoso, quem seria?", "hipotetico"],
  ["Se tivesse que morar em outro país, qual escolheria?", "Se tivesse que aprender outro idioma, qual escolheria?", "hipotetico"],
  ["Se fosse personagem de filme, quem seria?", "Se fosse personagem de livro, quem seria?", "hipotetico"],
  ["Se pudesse ter qualquer carro, qual seria?", "Se pudesse ter qualquer casa, como seria?", "hipotetico"],
  ["Se tivesse que comer uma coisa pro resto da vida, o que seria?", "Se tivesse que ouvir uma música pro resto da vida, qual seria?", "hipotetico"],
  ["Se pudesse mudar uma coisa no mundo, o que seria?", "Se pudesse mudar uma coisa em você, o que seria?", "hipotetico"],
  ["Se tivesse uma máquina do tempo, qual época visitaria?", "Se tivesse um portal dimensional, qual mundo visitaria?", "hipotetico"],
  ["Se pudesse dominar qualquer instrumento, qual seria?", "Se pudesse dominar qualquer esporte, qual seria?", "hipotetico"],
  ["Se escrevesse um livro, sobre o que seria?", "Se dirigisse um filme, sobre o que seria?", "hipotetico"],
  ["Se pudesse reviver um momento, qual seria?", "Se pudesse apagar um momento, qual seria?", "hipotetico"],
  ["Se tivesse que sobreviver numa ilha deserta, o que levaria?", "Se tivesse que sobreviver num apocalipse zumbi, o que levaria?", "hipotetico"],
  ["Se fosse um super-herói, qual seria seu nome?", "Se fosse um vilão, qual seria seu nome?", "hipotetico"],
  ["Se pudesse ter um robô assistente, o que ele faria?", "Se pudesse ter um clone, o que ele faria?", "hipotetico"],
  ["Se acordasse em 2050, o que faria primeiro?", "Se acordasse em 1900, o que faria primeiro?", "hipotetico"],
  ["Se tivesse que escolher entre fama ou fortuna, qual escolheria?", "Se tivesse que escolher entre sabedoria ou juventude eterna, qual escolheria?", "hipotetico"],
  ["Se pudesse falar com animais, qual falaria primeiro?", "Se pudesse falar com objetos, qual falaria primeiro?", "hipotetico"],
  ["Se fosse presidente por um dia, o que faria?", "Se fosse diretor de escola por um dia, o que faria?", "hipotetico"],
  ["Se pudesse ter qualquer pet exótico, qual teria?", "Se pudesse ter qualquer poder mágico, qual teria?", "hipotetico"],
  ["Se sua vida fosse um filme, qual seria o gênero?", "Se sua vida fosse uma música, qual seria o estilo?", "hipotetico"],
  ["Se pudesse inventar algo, o que seria?", "Se pudesse descobrir algo, o que seria?", "hipotetico"],
  ["Se tivesse que viver sem internet ou sem TV, qual escolheria?", "Se tivesse que viver sem música ou sem filmes, qual escolheria?", "hipotetico"],
  ["Se encontrasse uma lâmpada mágica, quais seriam seus 3 desejos?", "Se encontrasse um gênio, qual pergunta faria?", "hipotetico"],
  ["Se pudesse trocar de vida com alguém por um dia, quem seria?", "Se pudesse trocar de profissão por um dia, qual seria?", "hipotetico"],
  ["Se tivesse que escolher um tema para festa, qual seria?", "Se tivesse que escolher um tema para tatuagem, qual seria?", "hipotetico"],
  ["Se pudesse criar uma lei, qual seria?", "Se pudesse abolir uma lei, qual seria?", "hipotetico"],
  ["Se tivesse que descrever sua vida em uma palavra, qual seria?", "Se tivesse que descrever o mundo em uma palavra, qual seria?", "hipotetico"],

  // ===== PREFERÊNCIAS E OPINIÕES (146-175) =====
  ["Praia ou campo?", "Montanha ou cidade?", "preferencia"],
  ["Manhã ou noite?", "Verão ou inverno?", "preferencia"],
  ["Doce ou salgado?", "Quente ou frio?", "preferencia"],
  ["Livro físico ou e-book?", "Cinema ou streaming?", "preferencia"],
  ["Gato ou cachorro?", "Pássaro ou peixe?", "preferencia"],
  ["Chuva ou sol?", "Neve ou calor?", "preferencia"],
  ["Cozinhar ou pedir delivery?", "Comer em casa ou no restaurante?", "preferencia"],
  ["Festa grande ou reunião íntima?", "Balada ou barzinho?", "preferencia"],
  ["Trabalho remoto ou presencial?", "Estudar sozinho ou em grupo?", "preferencia"],
  ["Viajar de avião ou de carro?", "Viajar sozinho ou acompanhado?", "preferencia"],
  ["Acordar cedo ou dormir tarde?", "Planejar tudo ou ser espontâneo?", "preferencia"],
  ["Música alta ou música baixa?", "Silêncio ou barulho de fundo?", "preferencia"],
  ["Foto ou vídeo?", "Texto ou áudio?", "preferencia"],
  ["Natal ou Ano Novo?", "Carnaval ou São João?", "preferencia"],
  ["Sapato ou tênis?", "Calça ou bermuda?", "preferencia"],
  ["Pizza ou hambúrguer?", "Sushi ou churrasco?", "preferencia"],
  ["Futebol ou vôlei?", "Basquete ou natação?", "preferencia"],
  ["Série ou filme?", "Podcast ou rádio?", "preferencia"],
  ["WhatsApp ou Telegram?", "Instagram ou TikTok?", "preferencia"],
  ["Banho quente ou banho frio?", "Banho rápido ou banho demorado?", "preferencia"],
  ["Cabelo curto ou cabelo longo?", "Barba ou sem barba?", "preferencia"],
  ["Café preto ou café com leite?", "Com açúcar ou sem açúcar?", "preferencia"],
  ["Ler notícias ou assistir notícias?", "Jornal ou revista?", "preferencia"],
  ["Apartamento ou casa?", "Cidade grande ou cidade pequena?", "preferencia"],
  ["Andar descalço ou de chinelo?", "Meia ou sem meia?", "preferencia"],
  ["Escrever à mão ou digitar?", "Agenda física ou digital?", "preferencia"],
  ["Elevador ou escada?", "Escada rolante ou esteira?", "preferencia"],
  ["Fone de ouvido ou caixa de som?", "Bluetooth ou com fio?", "preferencia"],
  ["Papel higiênico dobrado ou amassado?", "Toalha de papel ou secador de mãos?", "preferencia"],
  ["Janela aberta ou fechada para dormir?", "Luz acesa ou apagada para dormir?", "preferencia"],

  // ===== CULTURA E CONHECIMENTO (176-200) =====
  ["Qual período da história mais te fascina?", "Qual civilização antiga mais te fascina?", "cultura"],
  ["Qual descoberta científica você acha mais importante?", "Qual invenção você acha mais importante?", "cultura"],
  ["Qual idioma soa mais bonito?", "Qual escrita parece mais bonita?", "cultura"],
  ["Qual mitologia você mais gosta?", "Qual lenda urbana você mais gosta?", "cultura"],
  ["Qual planeta do sistema solar te intriga mais?", "Qual fenômeno natural te intriga mais?", "cultura"],
  ["Qual sua matéria favorita na escola?", "Qual curso você faria por diversão?", "cultura"],
  ["Qual cientista você mais admira?", "Qual artista você mais admira?", "cultura"],
  ["Qual estilo de arte você mais gosta?", "Qual estilo de arquitetura você mais gosta?", "cultura"],
  ["Qual sua curiosidade favorita sobre o espaço?", "Qual sua curiosidade favorita sobre o oceano?", "cultura"],
  ["Qual filosofia de vida te inspira?", "Qual provérbio te inspira?", "cultura"],
  ["Qual museu do mundo você mais quer visitar?", "Qual biblioteca do mundo você mais quer visitar?", "cultura"],
  ["Qual fato histórico mais te surpreende?", "Qual teoria científica mais te surpreende?", "cultura"],
  ["Qual tradição cultural de outro país te atrai?", "Qual culinária de outro país te atrai?", "cultura"],
  ["Qual sua opinião sobre inteligência artificial?", "Qual sua opinião sobre exploração espacial?", "cultura"],
  ["Qual gênero literário você mais gosta?", "Qual gênero cinematográfico você mais gosta?", "cultura"],
  ["Qual esporte olímpico é o mais emocionante?", "Qual esporte de inverno é o mais emocionante?", "cultura"],
  ["Qual dança você gostaria de aprender?", "Qual arte marcial você gostaria de aprender?", "cultura"],
  ["Qual religião ou filosofia te desperta curiosidade?", "Qual cultura indígena te desperta curiosidade?", "cultura"],
  ["Qual tecnologia do futuro te anima mais?", "Qual avanço médico do futuro te anima mais?", "cultura"],
  ["Qual obra de arte é a mais icônica?", "Qual monumento é o mais icônico?", "cultura"],
  ["Qual compositor clássico você mais gosta?", "Qual pintor clássico você mais gosta?", "cultura"],
  ["Qual enigma da humanidade te fascina?", "Qual mistério não resolvido te fascina?", "cultura"],
  ["Qual revolução histórica foi mais impactante?", "Qual movimento social foi mais impactante?", "cultura"],
  ["Qual sua teoria conspiratória favorita (por diversão)?", "Qual lenda urbana brasileira é sua favorita?", "cultura"],
  ["Qual é o sentido da vida para você?", "Qual é a coisa mais importante na vida para você?", "cultura"],

  // ===== AMBIGUIDADE E MALÍCIA (201-249) =====
  ["O que você faz quando está sozinho em casa à noite?", "O que você faz quando está sozinho no quarto?", "malicia"],
  ["Qual é a coisa mais quente que você já fez?", "Qual é a coisa mais picante que você já comeu?", "malicia"],
  ["O que você nunca faria na frente dos seus pais?", "O que você nunca faria na frente do seu chefe?", "malicia"],
  ["Qual foi a última vez que você mentiu para alguém próximo?", "Qual foi a última vez que você omitiu algo importante?", "malicia"],
  ["O que você faz quando ninguém está olhando?", "O que você faz quando acha que ninguém vai saber?", "malicia"],
  ["Qual é o seu segredo mais bem guardado?", "Qual é a coisa que você nunca contou para ninguém?", "malicia"],
  ["O que você faria com R$1000 que ninguém poderia saber?", "O que você compraria se ninguém fosse ver?", "malicia"],
  ["Qual é a coisa mais estranha que você já fez por vontade própria?", "Qual é a coisa mais estranha que você já fez por pressão social?", "malicia"],
  ["O que você pensa quando está num lugar silencioso?", "O que você pensa quando deveria estar prestando atenção?", "malicia"],
  ["Qual é a sua maior fraqueza que você tenta esconder?", "Qual é o seu maior defeito que você tenta disfarçar?", "malicia"],
  ["O que você faz com o celular quando está no banheiro?", "O que você faz com o celular quando deveria estar dormindo?", "malicia"],
  ["Qual é a coisa mais constrangedora que já aconteceu com você?", "Qual é a coisa mais vergonhosa que você já fez?", "malicia"],
  ["O que você faria se soubesse que não seria pego?", "O que você faria se pudesse apagar da memória de todos?", "malicia"],
  ["Qual é o tipo de pessoa que te atrai mais?", "Qual é o tipo de pessoa que te deixa mais nervoso?", "malicia"],
  ["O que você faz quando está com raiva mas precisa fingir que está bem?", "O que você faz quando está com ciúmes mas tenta esconder?", "malicia"],
  ["Qual é a coisa mais cara que você já comprou por impulso?", "Qual é a coisa mais cara que você já escondeu que comprou?", "malicia"],
  ["O que você faz quando está entediado numa festa?", "O que você faz quando quer ir embora mas não pode?", "malicia"],
  ["Qual é o pior conselho que você já deu?", "Qual é o pior conselho que você já seguiu?", "malicia"],
  ["O que você faria diferente se pudesse voltar aos 18 anos?", "O que você faria diferente se pudesse voltar à semana passada?", "malicia"],
  ["Qual é a coisa mais atrevida que você já fez?", "Qual é a coisa mais ousada que você já pensou em fazer?", "malicia"],
  ["O que você faz quando está com uma pessoa que não aguenta?", "O que você faz quando está com uma pessoa que te irrita?", "malicia"],
  ["Qual é a mentira que você mais conta para si mesmo?", "Qual é a desculpa que você mais usa para os outros?", "malicia"],
  ["O que você pesquisa no Google que nunca contaria para ninguém?", "O que você assiste no YouTube às 2 da manhã?", "malicia"],
  ["Qual é a coisa mais íntima que você já compartilhou com um estranho?", "Qual é a coisa mais íntima que você nunca compartilhou com ninguém?", "malicia"],
  ["O que você faz quando termina uma série e não sabe o que fazer da vida?", "O que você faz quando acaba o delivery e ainda está com fome?", "malicia"],
  ["Qual é a coisa mais ridícula pela qual você já ficou com raiva?", "Qual é a coisa mais boba pela qual você já chorou?", "malicia"],
  ["O que você faz quando percebe que enviou uma mensagem para a pessoa errada?", "O que você faz quando curte uma foto antiga sem querer?", "malicia"],
  ["Qual é a coisa mais desnecessária que você já comprou?", "Qual é a coisa mais inútil que você ainda guarda?", "malicia"],
  ["O que você faz quando está com vontade de falar algo mas sabe que não deve?", "O que você faz quando sabe de uma fofoca mas deveria ficar quieto?", "malicia"],
  ["Qual é a coisa mais egoísta que você já fez?", "Qual é a coisa mais egoísta que você já pensou?", "malicia"],
  ["O que você faz quando está com sono mas não consegue dormir?", "O que você faz quando está acordado às 3 da manhã pensando besteira?", "malicia"],
  ["Qual é a coisa mais embaraçosa que você já enviou por mensagem?", "Qual é a coisa mais embaraçosa que você já postou nas redes sociais?", "malicia"],
  ["O que você faz quando está num elevador com alguém em silêncio?", "O que você faz quando está numa fila longa com estranhos?", "malicia"],
  ["Qual é a coisa mais questionável que você já fez por amor?", "Qual é a coisa mais questionável que você já fez por dinheiro?", "malicia"],
  ["O que você faz quando alguém te dá um presente que você odeia?", "O que você faz quando alguém te faz um elogio que não acredita?", "malicia"],
  ["Qual é a coisa mais suspeita que você já fez sem perceber?", "Qual é a coisa mais suspeita que você já fez de propósito?", "malicia"],
  ["O que você faz quando está com ciúmes mas tenta parecer indiferente?", "O que você faz quando está com inveja mas finge torcer pelo outro?", "malicia"],
  ["Qual é o pior momento em que você riu quando não devia?", "Qual é o pior momento em que você ficou sério quando todos riam?", "malicia"],
  ["O que você faz quando descobre que falaram de você pelas costas?", "O que você faz quando você mesmo falou de alguém pelas costas?", "malicia"],
  ["Qual é a coisa mais perigosa que você já fez por diversão?", "Qual é a coisa mais perigosa que você já fez por curiosidade?", "malicia"],
  ["O que você faz quando está com vontade de sumir do mundo?", "O que você faz quando quer desaparecer de uma situação?", "malicia"],
  ["Qual é a coisa mais impulsiva que você já fez e não se arrependeu?", "Qual é a coisa mais impulsiva que você já fez e se arrependeu?", "malicia"],
  ["O que você faz quando alguém te pede um favor que não quer fazer?", "O que você faz quando precisa dizer não mas não consegue?", "malicia"],
  ["Qual é a coisa mais inapropriada que você já pensou num momento sério?", "Qual é a coisa mais inapropriada que você já falou sem querer?", "malicia"],
  ["O que você faz quando está com uma pessoa que fala demais?", "O que você faz quando está com uma pessoa que não para de reclamar?", "malicia"],
  ["Qual é a coisa mais louca que você já fez para impressionar alguém?", "Qual é a coisa mais louca que você já fez para evitar uma situação?", "malicia"],
  ["O que você faz quando percebe que está sendo observado?", "O que você faz quando percebe que alguém está te seguindo nas redes?", "malicia"],
  ["Qual é a coisa mais íntima que você já revelou sem querer?", "Qual é a coisa mais íntima que alguém já revelou sobre você?", "malicia"],
  ["O que você faz quando está com vontade de falar uma verdade que vai machucar?", "O que você faz quando sabe de algo que mudaria tudo mas prefere calar?", "malicia"],
  ["Qual é a coisa mais difícil que você já teve que fingir não saber?", "Qual é a coisa mais difícil que você já teve que fingir não sentir?", "malicia"],
    
  // ===== AMBIGUIDADE E DUPLO SENTIDO (251-275) =====
  ["O que você gosta de fazer no escuro?", "O que você gosta de fazer quando acaba a luz?", "ambiguo"],
  ["Qual é a coisa mais volumosa que você tem no quarto?", "Qual é a coisa mais pesada que você tem no quarto?", "ambiguo"],
  ["O que você prefere que seja bem grande?", "O que você prefere que dure muito tempo?", "ambiguo"],
  ["Onde você gosta que te toquem?", "Onde você gosta que te façam massagem?", "ambiguo"],
  ["Qual posição você prefere para relaxar?", "Qual posição você prefere para dormir?", "ambiguo"],
  ["O que você gosta de fazer com as mãos?", "O que você gosta de fazer para passar o tempo?", "ambiguo"],
  ["Qual é a melhor sensação do mundo?", "Qual é o melhor prazer da vida?", "ambiguo"],
  ["O que você costuma fazer embaixo do cobertor?", "O que você costuma fazer quando está com frio?", "ambiguo"],
  ["O que você gosta que seja bem macio?", "O que você gosta que seja bem firme?", "ambiguo"],
  ["Qual barulho te dá arrepios?", "Qual toque te dá arrepios?", "ambiguo"],
  ["O que você prefere fazer acompanhado?", "O que você prefere fazer em público?", "ambiguo"],
  ["Qual é o lugar mais estranho onde você já entrou?", "Qual é o lugar mais estranho onde você já dormiu?", "ambiguo"],
  ["O que você gosta de levar para a cama?", "O que você gosta de ler antes de dormir?", "ambiguo"],
  ["O que você prefere que seja rápido?", "O que você prefere que seja devagar?", "ambiguo"],
  ["Qual é a coisa mais quente que você tem em casa?", "Qual é a coisa mais perigosa que você tem em casa?", "ambiguo"],
  ["O que você faz para esquentar o clima?", "O que você faz para se aquecer no inverno?", "ambiguo"],
  ["O que você gosta de fazer quando está suado?", "O que você faz logo após o exercício físico?", "ambiguo"],
  ["Qual é o seu tamanho ideal?", "Qual é a sua altura ideal?", "ambiguo"],
  ["O que você prefere fazer sem roupa?", "O que você prefere fazer logo que acorda?", "ambiguo"],
  ["Qual objeto você usa para se satisfazer?", "Qual objeto você usa para se divertir?", "ambiguo"],
  ["O que você gosta de fazer com a boca?", "Qual é o seu maior vício oral?", "ambiguo"],
  ["O que você gosta de apertar?", "O que você gosta de abraçar?", "ambiguo"],
  ["Qual é o seu brinquedo favorito?", "Qual é o seu gadget favorito?", "ambiguo"],
  ["O que você faz para relaxar os músculos?", "O que você faz para aliviar o estresse?", "ambiguo"],
  ["O que você gosta de fazer no banco de trás?", "O que você gosta de fazer em viagens longas?", "ambiguo"],

  // ===== MALÍCIA E COMPORTAMENTO (276-300) =====
  ["O que você faria por 1 milhão de reais?", "O que você faria para salvar sua carreira?", "malicia"],
  ["Quem você apagaria da sua vida?", "Quem você bloquearia para sempre?", "malicia"],
  ["O que você esconde embaixo da cama?", "O que você esconde no histórico do navegador?", "malicia"],
  ["Qual lei você quebraria se soubesse que não seria preso?", "Qual regra social você odeia seguir?", "malicia"],
  ["O que você faria se fosse invisível no vestiário?", "O que você faria se fosse invisível num banco?", "malicia"],
  ["Qual é a sua fantasia mais secreta?", "Qual é o seu plano de vida mais ambicioso?", "malicia"],
  ["O que você já roubou?", "O que você já pegou emprestado e nunca devolveu?", "malicia"],
  ["Quem você beijaria agora se pudesse?", "Quem você abraçaria agora se pudesse?", "malicia"],
  ["O que você faria se soubesse que seu melhor amigo é um traidor?", "O que você faria se soubesse que seu parceiro te traiu?", "malicia"],
  ["Qual parte do corpo você mais olha nos outros?", "Qual é a primeira coisa que você nota em alguém?", "malicia"],
  ["O que você faria se ficasse preso num elevador com seu ex?", "O que você faria se ficasse preso num elevador com seu chefe?", "malicia"],
  ["Qual é o seu maior guilty pleasure?", "Qual é o seu vício mais caro?", "malicia"],
  ["Quantas vezes por dia você pensa em sexo?", "Quantas vezes por dia você olha o celular?", "malicia"],
  ["O que você faria com o corpo de um inimigo?", "O que você faria se encontrasse uma mala de dinheiro sujo?", "malicia"],
  ["Qual é o nome da pessoa que você mais stalkeia?", "Qual é o nome da pessoa que você mais admira em segredo?", "malicia"],
  ["Qual mentira você contou hoje?", "Qual verdade você omitiu hoje?", "malicia"],
  ["O que você faria para ser a pessoa mais famosa do mundo?", "O que você faria para ser a pessoa mais rica do mundo?", "malicia"],
  ["Qual é o seu pensamento mais sombrio?", "Qual é o seu maior arrependimento?", "malicia"],
  ["O que você faria se visse alguém sendo traído?", "O que você faria se visse alguém roubando comida?", "malicia"],
  ["Quem você levaria para uma ilha apenas para prazer?", "Quem você levaria para uma ilha para sobreviver?", "malicia"],
  ["O que você faz para seduzir alguém?", "O que você faz para convencer alguém de algo?", "malicia"],
  ["Qual é a sua maior insegurança na cama?", "Qual é a sua maior insegurança no trabalho?", "malicia"],
  ["O que você faria se pudesse ler a mente do parceiro?", "O que você faria se pudesse ler a mente do inimigo?", "malicia"],
  ["Qual é o lugar mais proibido onde você já esteve?", "Qual é o lugar mais perigoso onde você já esteve?", "malicia"],
  ["O que você faria se ganhasse o poder da sedução absoluta?", "O que você faria se ganhasse o poder da persuasão absoluta?", "malicia"],

  // ===== SUBJETIVIDADE E CONCEITOS (301-325) =====
  ["Qual é a melhor cor para um quarto?", "Qual é a melhor cor para um carro de luxo?", "subjetivo"],
  ["O que não pode faltar numa festa?", "O que não pode faltar num funeral?", "subjetivo"],
  ["Qual é o cheiro de limpeza?", "Qual é o cheiro de riqueza?", "subjetivo"],
  ["O que define uma pessoa boa?", "O que define uma pessoa inteligente?", "subjetivo"],
  ["Qual é a melhor idade para casar?", "Qual é a melhor idade para se aposentar?", "subjetivo"],
  ["O que é mais importante: amor ou respeito?", "O que é mais importante: dinheiro ou tempo?", "subjetivo"],
  ["Como você descreveria o sucesso?", "Como você descreveria a felicidade?", "subjetivo"],
  ["Qual é o limite da liberdade?", "Qual é o limite da privacidade?", "subjetivo"],
  ["O que você considera uma traição?", "O que você considera uma falta de caráter?", "subjetivo"],
  ["Qual é o som do silêncio?", "Qual é o som da solidão?", "subjetivo"],
  ["O que você faria se o mundo acabasse amanhã?", "O que você faria se ficasse imortal hoje?", "subjetivo"],
  ["Qual é a maior virtude de um ser humano?", "Qual é o maior defeito de um ser humano?", "subjetivo"],
  ["O que faz um lugar ser aconchegante?", "O que faz um lugar ser chique?", "subjetivo"],
  ["Qual é o peso da verdade?", "Qual é o preço da mentira?", "subjetivo"],
  ["O que é pecado para você?", "O que é crime para você?", "subjetivo"],
  ["Qual é a melhor forma de morrer?", "Qual é a melhor forma de nascer de novo?", "subjetivo"],
  ["O que é arte?", "O que é lixo?", "subjetivo"],
  ["Qual é a cor da inveja?", "Qual é a cor da esperança?", "subjetivo"],
  ["O que você sacrificaria por alguém?", "O que você nunca sacrificaria por ninguém?", "subjetivo"],
  ["Como você sabe que está amando?", "Como você sabe que está sendo enganado?", "subjetivo"],
  ["O que é justiça?", "O que é vingança?", "subjetivo"],
  ["Qual é a sensação de ser livre?", "Qual é a sensação de estar no controle?", "subjetivo"],
  ["O que é beleza para você?", "O que é estilo para você?", "subjetivo"],
  ["Qual é a maior loucura que já cometeu?", "Qual é a maior aventura que já viveu?", "subjetivo"],
  ["O que quer que escrevam na sua lápide?", "O que quer que digam no seu aniversário de 80 anos?", "subjetivo"],

  // ===== HIPOTÉTICOS E SURREAIS (326-350) =====
  ["Se você pudesse ser um deus, do que seria?", "Se você pudesse ser um monstro, qual seria?", "hipotetico"],
  ["Se pudesse ver o futuro, o que não queria saber?", "Se pudesse ver o passado, o que mudaria?", "hipotetico"],
  ["Escolheria nunca mais falar ou nunca mais ouvir?", "Escolheria nunca mais ver ou nunca mais tocar?", "hipotetico"],
  ["Se trocasse de corpo com um animal, qual seria?", "Se fosse um objeto inanimado por um dia, qual seria?", "hipotetico"],
  ["Qual seria o boss final da sua vida?", "Quem seria o diretor do filme da sua vida?", "hipotetico"],
  ["Se pudesse criar uma nova cor, como ela seria?", "Se pudesse criar um novo sentido humano, qual seria?", "hipotetico"],
  ["Se encontrasse um alienígena, o que diria?", "Se encontrasse Deus, o que perguntaria?", "hipotetico"],
  ["Se vivesse em qualquer ficção, qual seria?", "Se deletasse um evento da história, qual seria?", "hipotetico"],
  ["Falaria 5 min com seu eu de 5 anos atrás?", "Falaria 5 min com seu eu de 20 anos no futuro?", "hipotetico"],
  ["Se colonizasse um planeta, qual seria o nome?", "Se criasse um país, qual seria a primeira lei?", "hipotetico"],
  ["Se fosse invisível apenas no escuro, o que faria?", "Se voasse apenas a 10cm do chão, o que faria?", "hipotetico"],
  ["Se tivesse que perder uma memória, qual seria?", "Se implantasse uma memória em alguém, qual seria?", "hipotetico"],
  ["Se transformasse água em qualquer bebida?", "Se transformasse pedras em qualquer objeto?", "hipotetico"],
  ["Se parasse o tempo para todos, menos para você?", "Se acelerasse o tempo em momentos chatos?", "hipotetico"],
  ["Se fosse um fantasma, quem você assombraria?", "Se fosse um anjo da guarda, quem protegeria?", "hipotetico"],
  ["Se vivesse dentro de um quadro, qual seria?", "Se vivesse dentro de uma música, qual seria?", "hipotetico"],
  ["Gostaria de saber a data da sua morte?", "Gostaria de saber a causa da sua morte?", "hipotetico"],
  ["Se mudasse de gênero por uma semana?", "Se mudasse de espécie por uma semana?", "hipotetico"],
  ["Falaria todos os idiomas mas ficaria mudo?", "Tocaria todos os instrumentos mas ficaria surdo?", "hipotetico"],
  ["Preferia ter um dragão ou um unicórnio?", "Preferia ter uma fênix ou um grifo?", "hipotetico"],
  ["Se o dinheiro deixasse de existir amanhã?", "Se a internet deixasse de existir amanhã?", "hipotetico"],
  ["Trocaria sua inteligência por beleza?", "Trocaria sua sorte por talento?", "hipotetico"],
  ["Se descobrisse que vive numa simulação?", "Se descobrisse que todos são robôs menos você?", "hipotetico"],
  ["Viajaria para o centro da terra ou para Marte?", "Viajaria para o fundo do mar ou para o Sol?", "hipotetico"],
  ["Seria um personagem de Shakespeare ou de terror?", "Seria um herói grego ou um pirata?", "hipotetico"],

  // ===== COTIDIANO E PECULIARIDADES (351-375) =====
  ["Como você corta o cabelo?", "Como você apara os pelos?", "cotidiano"],
  ["O que faz primeiro ao entrar no banho?", "O que faz primeiro ao entrar na piscina?", "cotidiano"],
  ["Qual é a sua mania mais irritante?", "Qual é o seu tique nervoso?", "cotidiano"],
  ["Como você organiza suas roupas?", "Como você organiza seus arquivos no PC?", "cotidiano"],
  ["Qual é o seu lado da cama?", "Qual é o seu lugar no sofá?", "cotidiano"],
  ["O que faz com as mãos enquanto caminha?", "O que faz com as mãos enquanto fala?", "cotidiano"],
  ["Sua primeira ação ao chegar em casa?", "Sua primeira ação ao chegar no trabalho?", "cotidiano"],
  ["Como você gosta de ovos?", "Como você gosta de carne?", "cotidiano"],
  ["Qual é a sua marca de sabão favorita?", "Qual é a sua marca de pasta de dente?", "cotidiano"],
  ["Como reage a um elogio de um estranho?", "Como reage a uma crítica de um amigo?", "cotidiano"],
  ["O que faz quando vê uma barata?", "O que faz quando vê um ex na rua?", "cotidiano"],
  ["Seu critério para desvendar um mistério?", "Seu critério para escolher um filme?", "cotidiano"],
  ["Limpa a tela do celular com o quê?", "Limpa os óculos com o quê?", "cotidiano"],
  ["Seu hábito antes de postar uma foto?", "Seu hábito antes de enviar um e-mail?", "cotidiano"],
  ["Como dorme quando está muito calor?", "Como dorme quando está muito cansado?", "cotidiano"],
  ["O que faz com a sobra da comida?", "O que faz com as roupas que não usa?", "cotidiano"],
  ["Como lida com vizinhos barulhentos?", "Como lida com colegas preguiçosos?", "cotidiano"],
  ["Seu ritual de domingo à noite?", "Seu ritual de segunda de manhã?", "cotidiano"],
  ["Como escolhe suas senhas?", "Como escolhe os nomes dos personagens?", "cotidiano"],
  ["O que faz quando a internet cai?", "O que faz quando a bateria acaba?", "cotidiano"],
  ["Como você carrega o celular?", "Como você carrega as sacolas?", "cotidiano"],
  ["Prefere luz branca ou amarela?", "Prefere cortina ou persiana?", "cotidiano"],
  ["O que faz com o troco?", "O que faz com papéis de bala?", "cotidiano"],
  ["Como se comporta em casamentos?", "Como se comporta em velórios?", "cotidiano"],
  ["Lugar favorito para pensar?", "Lugar favorito para chorar?", "cotidiano"],

  // ===== COMPORTAMENTO SOCIAL FINAL (376-400) =====
  ["Lida melhor com crianças chorando ou idosos?", "Lida melhor com cães latindo ou tecnologia?", "cotidiano"],
  ["O que faz com notificações pendentes?", "O que faz com abas abertas no navegador?", "cotidiano"],
  ["Como você descasca uma fruta?", "Como abre uma embalagem difícil?", "cotidiano"],
  ["Esqueceu o nome de alguém, o que faz?", "Fingiu que conhecia alguém, o que faz?", "cotidiano"],
  ["Sua paciência com lerdeza humana?", "Sua paciência com erro de software?", "cotidiano"],
  ["Reação a uma piada sem graça?", "Reação a um spoiler de algo que ama?", "cotidiano"],
  ["O que faz quando está com soluço?", "O que faz quando está com espirro preso?", "cotidiano"],
  ["Como organiza o dinheiro na carteira?", "Como organiza suas chaves?", "cotidiano"],
  ["O que faz com os 'vistos' do WhatsApp?", "O que faz com chamadas de desconhecidos?", "cotidiano"],
  ["Gosta da almofada alta ou baixa?", "Gosta do colchão macio ou duro?", "cotidiano"],
  ["O que faz quando tropeça em público?", "O que faz quando fala algo errado em público?", "cotidiano"],
  ["Como escolhe lugar no ônibus?", "Como escolhe lugar no cinema?", "cotidiano"],
  ["O que faz com pilhas usadas?", "O que faz com lixo eletrônico?", "cotidiano"],
  ["Como você se despede em festas?", "Como você cumprimenta estranhos?", "cotidiano"],
  ["Reação ao ganhar um sorteio pequeno?", "Reação ao perder uma aposta boba?", "cotidiano"],
  ["Banho com música ou silêncio?", "Faxina com música ou silêncio?", "cotidiano"],
  ["Vê alguém chorando na rua, o que faz?", "Vê alguém brigando na rua, o que faz?", "cotidiano"],
  ["Como lida com o despertador?", "Como lida com o sono pós-almoço?", "cotidiano"],
  ["O que faz com fotos que ficam ruins?", "O que faz com prints antigos?", "cotidiano"],
  ["Reação a queda de energia?", "Reação a falta de água?", "cotidiano"],
  ["O que faz com música chiclete?", "O que faz com pensamento repetitivo?", "cotidiano"],
  ["Como gosta da sua pipoca?", "Como gosta do seu milho?", "cotidiano"],
  ["Alguém errou seu nome, você corrige?", "Você errou o nome de alguém, o que faz?", "cotidiano"],
  ["Se sente mal em lugares altos?", "Se sente mal em lugares apertados?", "cotidiano"],
  ["Primeira ação ao abrir o Instagram?", "Primeira ação ao abrir o computador?", "cotidiano"],
];

// ==========================================
// Execução principal
// ==========================================

async function main() {
  const pool = new Pool(buildPoolConfig());
  const forceReset = process.argv.includes('--reset');

  try {
    // Garantir que a tabela existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_pairs (
        id                SERIAL PRIMARY KEY,
        question_normal   TEXT NOT NULL,
        question_impostor TEXT NOT NULL,
        category          TEXT DEFAULT 'geral'
      )
    `);

    if (forceReset) {
      await pool.query('TRUNCATE TABLE question_pairs RESTART IDENTITY CASCADE');
      console.log('🗑️  Tabela question_pairs limpa (--reset).');
    }

    // Inserir com ON CONFLICT DO NOTHING (idempotente por conteúdo)
    // Adiciona constraint única se não existir
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'question_pairs_content_unique'
        ) THEN
          ALTER TABLE question_pairs
            ADD CONSTRAINT question_pairs_content_unique
            UNIQUE (question_normal, question_impostor);
        END IF;
      END $$
    `);

    let inserted = 0;
    let skipped = 0;

    for (const [normal, impostor, category] of pairs) {
      const result = await pool.query(
        `INSERT INTO question_pairs (question_normal, question_impostor, category)
         VALUES ($1, $2, $3)
         ON CONFLICT ON CONSTRAINT question_pairs_content_unique DO NOTHING`,
        [normal, impostor, category]
      );
      if (result.rowCount > 0) inserted++;
      else skipped++;
    }

    const { rows } = await pool.query('SELECT COUNT(*) AS total FROM question_pairs');
    console.log(`✅ Seed concluído!`);
    console.log(`   Inseridas: ${inserted} | Ignoradas (já existiam): ${skipped}`);
    console.log(`   Total no banco: ${rows[0].total} duplas de perguntas.`);

  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
