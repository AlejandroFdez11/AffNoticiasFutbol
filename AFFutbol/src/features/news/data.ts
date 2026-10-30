import type { NewsArticle, TransferRumor } from './types';

const teamLogo = (teamId: number) => `https://media.api-sports.io/football/teams/${teamId}.png`;

/**
 * Curated sample content for Phase 2.
 *
 * Everything here is fictional demo material (the rumours use invented
 * players) and is labelled as such in the UI. It keeps the newsroom experience
 * testable without an API key or extra quota until Supabase lands in Phase 3.
 */
export const ARTICLES: NewsArticle[] = [
  {
    id: 'derbi-betis-sevilla',
    kind: 'news',
    topic: 'LaLiga',
    title: 'El Betis se queda el derbi con un gol en el descuento',
    summary:
      'Un remate en el último suspiro decide un partido trabado, con dos equipos que se conocían demasiado bien.',
    body: [
      'El Benito Villamarín empujó hasta el final y encontró premio en el minuto 93. Después de una primera parte de tanteo, el Betis adelantó líneas y convirtió el derbi en un intercambio de golpes que pudo caer de cualquier lado.',
      'El Sevilla respondió con un golpe de efecto nada más reanudarse el encuentro, pero los verdiblancos no perdieron la paciencia. El técnico movió el banquillo, ganó presencia en el área y encontró el premio en una segunda jugada a balón parado.',
      'Con este resultado, el Betis se mete de lleno en la pelea por los puestos europeos y el Sevilla se queda con la sensación de haber dejado escapar un punto que tenía en la mano. La próxima jornada pondrá a prueba la capacidad de reacción de ambos.',
    ],
    source: 'Redacción AFFutbol',
    author: 'Alejandro Fernández',
    publishedHoursAgo: 2,
    readingMinutes: 4,
    tags: ['Derbi', 'LaLiga', 'Betis'],
    featured: true,
  },
  {
    id: 'arsenal-chelsea-derbi',
    kind: 'news',
    topic: 'Premier League',
    title: 'Arsenal y Chelsea reparten puntos en un derbi eléctrico',
    summary:
      'Dos goles en la primera media hora y un segundo tiempo de ataques sin premio dejan el derbi londinense en tablas.',
    body: [
      'El Emirates Stadium asistió a un derbi de ida y vuelta. El Arsenal salió con la presión alta de costumbre y encontró el primer gol tras una recuperación en campo contrario; el Chelsea respondió con una contra perfecta antes del descanso.',
      'En la segunda parte el partido se partió. Los locales acumularon ocasiones, pero se toparon con un portero inspirado y con el palo. El Chelsea, cómodo sin el balón, tuvo dos mano a mano para llevarse los tres puntos.',
      'El empate mantiene al Arsenal en la zona alta y deja al Chelsea con la sensación de que el paso adelante en su juego empieza a notarse. Ambos equipos afrontan la próxima jornada con la mirada puesta en la Champions.',
    ],
    source: 'Redacción AFFutbol',
    author: 'Marta Ruiz',
    publishedHoursAgo: 4,
    readingMinutes: 3,
    tags: ['Premier League', 'Arsenal', 'Chelsea'],
  },
  {
    id: 'inter-oficio-liderato',
    kind: 'news',
    topic: 'Serie A',
    title: 'El Inter defiende el liderato con oficio ante el Milan',
    summary:
      'Un gol tempranero y una defensa de tres que aguantó el asedio rossonero mantienen al Inter en lo más alto.',
    body: [
      'El derbi de Milán se decidió en los primeros minutos. El Inter encontró el gol en su primera llegada clara y, a partir de ahí, gestionó el partido con la madurez de un equipo acostumbrado a estas citas.',
      'El Milan tuvo el balón y las ocasiones, pero se estrelló una y otra vez con la línea de tres centrales interista. El portero local firmó dos paradas de mérito en el tramo final, cuando el partido se abrió por completo.',
      'Con la victoria, el Inter refuerza su condición de líder y suma una dosis extra de confianza para la recta final de la fase de grupos europea. El Milan, por su parte, deberá convertir su dominio en puntos si quiere acercarse a la cabeza.',
    ],
    source: 'Redacción AFFutbol',
    author: 'Luca Ferri',
    publishedHoursAgo: 6,
    readingMinutes: 4,
    tags: ['Serie A', 'Inter', 'Milan'],
  },
  {
    id: 'bayern-clasico',
    kind: 'news',
    topic: 'Bundesliga',
    title: 'El Bayern llega al clásico con la portería a cero',
    summary:
      'Los bávaros enlazan tres partidos sin encajar y recuperan a su pareja de centrales para recibir al Dortmund.',
    body: [
      'El Bayern ha encontrado en la solidez defensiva su mejor argumento en las últimas semanas. Tres partidos consecutivos sin encajar han devuelto la calma a un equipo que había hecho del intercambio de golpes su seña de identidad.',
      'La recuperación de los dos centrales titulares ha permitido al técnico adelantar la línea de presión sin miedo a las espaldas. El resultado son menos ocasiones concedidas y una salida de balón más limpia desde el primer pase.',
      'El Dortmund llega al clásico con dudas atrás, pero con la velocidad de sus extremos como principal amenaza. El duelo directo por el liderato promete ser el partido de la jornada en la Bundesliga.',
    ],
    source: 'Redacción AFFutbol',
    author: 'Jonas Weber',
    publishedHoursAgo: 9,
    readingMinutes: 3,
    tags: ['Bundesliga', 'Bayern', 'Dortmund'],
  },
  {
    id: 'champions-ultima-jornada',
    kind: 'news',
    topic: 'Champions League',
    title: 'La Champions aprieta: cinco equipos pelean por dos plazas',
    summary:
      'La última jornada de la fase de liga deja un escenario abierto, con el average y los goles como posibles jueces.',
    body: [
      'La nueva fase de liga de la Champions llega a su última jornada con una igualdad extrema en la zona media de la tabla. Cinco equipos, separados por apenas tres puntos, se disputan las dos últimas plazas que dan acceso directo a los octavos de final.',
      'El calendario no ayuda a hacer cábalas: dos de los implicados se enfrentan entre sí, mientras que el resto depende de resultados ajenos y del average de goles. Ganar no siempre será suficiente.',
      'Los entrenadores han insistido esta semana en la importancia de no especular. La experiencia de temporadas anteriores dice que la clasificación suele decidirse en el tiempo añadido, y nadie quiere dejar el billete en manos de una calculadora.',
    ],
    source: 'Redacción AFFutbol',
    author: 'Marta Ruiz',
    publishedHoursAgo: 14,
    readingMinutes: 5,
    tags: ['Champions League', 'Octavos'],
  },
  {
    id: 'mercado-enero-perfiles',
    kind: 'news',
    topic: 'Mercado',
    title: 'El mercado de enero calienta motores: los perfiles que más suenan',
    summary:
      'Centrales jóvenes, extremos con desborde y delanteros de perfil completo copan las quinielas de los grandes clubes.',
    body: [
      'Aunque el mercado de invierno todavía no ha abierto oficialmente, los departamentos de scouting ya han movido ficha. La prioridad de la mayoría de los grandes clubes pasa por reforzar la parcela defensiva con jugadores jóvenes y con experiencia en competición europea.',
      'En ataque, el perfil más buscado es el extremo capaz de jugar por las dos bandas y de generar ventajas en el uno contra uno. Varios clubes de la Premier han convertido esa posición en una urgencia tras las lesiones de las últimas semanas.',
      'La gran duda será el precio. Los equipos vendedores saben que enero es un mercado de necesidad y tienden a inflar las cifras. Las operaciones con fórmulas de pago aplazado o con opciones de compra serán la vía más habitual para cerrar refuerzos sin comprometer el fair play financiero.',
    ],
    source: 'Redacción AFFutbol',
    author: 'Alejandro Fernández',
    publishedHoursAgo: 20,
    readingMinutes: 4,
    tags: ['Mercado', 'Fichajes'],
  },
  {
    id: 'como-leer-xg',
    kind: 'news',
    topic: 'Análisis',
    title: 'Goles esperados, posesión y presión: cómo leer un partido en datos',
    summary:
      'El xG no explica todo, pero bien interpretado cuenta la historia que el marcador a veces esconde.',
    body: [
      'Los goles esperados (xG) miden la calidad de las ocasiones generadas, no los goles marcados. Dos equipos pueden acabar un partido con el mismo marcador y, sin embargo, haber generado situaciones de muy distinto valor.',
      'La posesión, por sí sola, tampoco dice quién domina. Hay equipos que acumulan el balón sin verticalidad y otros que, con un 35% de posesión, generan más peligro real. Lo interesante es cruzar la posesión con la altura de la recuperación y con el número de llegadas al área.',
      'La próxima vez que abras la pestaña de estadísticas de un partido, fíjate en la relación entre tiros a puerta, xG y paradas del portero. Esa combinación explica mejor que cualquier titular quién mereció ganar y quién se llevó los puntos por eficacia.',
    ],
    source: 'Redacción AFFutbol',
    author: 'Pablo Serrano',
    publishedHoursAgo: 26,
    readingMinutes: 5,
    tags: ['Análisis', 'xG', 'Estadísticas'],
  },
];

export const RUMORS: TransferRumor[] = [
  {
    id: 'rumor-riva-arsenal',
    kind: 'rumor',
    topic: 'Mercado',
    title: 'El Arsenal aprieta por Matteo Riva',
    summary:
      'El mediocentro italiano, de 22 años, interesa al Arsenal para reforzar la construcción desde el pivote.',
    body: [
      'El Arsenal ha intensificado los contactos con el entorno de Matteo Riva después de seguirle en los últimos meses. El club inglés busca un mediocentro capaz de jugar de espaldas y de romper la primera línea de presión.',
      'El Milan no tiene intención de negociar por debajo de los 45 millones de euros, una cifra que el Arsenal considera alta pero no descarta alcanzar con variables. Las conversaciones siguen abiertas y no se espera una decisión antes de enero.',
    ],
    source: 'Mercado AFFutbol',
    publishedHoursAgo: 3,
    player: 'Matteo Riva',
    position: 'Mediocentro',
    age: 22,
    from: { name: 'AC Milan', logo: teamLogo(489) },
    to: { name: 'Arsenal', logo: teamLogo(42) },
    fee: '45 M€',
    probability: 62,
    status: 'negociando',
  },
  {
    id: 'rumor-berg-liverpool',
    kind: 'rumor',
    topic: 'Mercado',
    title: 'El Liverpool acelera por Noah Berg',
    summary:
      'El extremo alemán ha pasado a ser la prioridad del Liverpool para la banda derecha.',
    body: [
      'El Liverpool quiere cerrar cuanto antes un extremo que le permita rotar sin perder velocidad en ataque. Noah Berg, de 24 años, encaja en el perfil: juega a pierna cambiada, encara en el uno contra uno y llega al área con facilidad.',
      'El RB Leipzig ha fijado su precio en 60 millones de euros y no parece dispuesto a bajar. El Liverpool estudia una oferta con una parte fija y otra en variables ligadas a objetivos colectivos.',
    ],
    source: 'Mercado AFFutbol',
    publishedHoursAgo: 5,
    player: 'Noah Berg',
    position: 'Extremo derecho',
    age: 24,
    from: { name: 'RB Leipzig', logo: teamLogo(173) },
    to: { name: 'Liverpool', logo: teamLogo(40) },
    fee: '60 M€',
    probability: 78,
    status: 'avanzado',
  },
  {
    id: 'rumor-salas-city',
    kind: 'rumor',
    topic: 'Mercado',
    title: 'El Manchester City sigue a Iker Salas',
    summary:
      'El lateral izquierdo del Betis, de 19 años, entra en la lista de futuribles del conjunto citizen.',
    body: [
      'El Manchester City ha incluido a Iker Salas en su lista de laterales jóvenes para la próxima temporada. El jugador del Betis ha llamado la atención por su capacidad para cubrir toda la banda y por su precisión en los centros.',
      'El Betis no tiene prisa por vender y remite a su cláusula de rescisión. El City, por ahora, se limita a seguir su evolución sin haber presentado una oferta formal.',
    ],
    source: 'Mercado AFFutbol',
    publishedHoursAgo: 8,
    player: 'Iker Salas',
    position: 'Lateral izquierdo',
    age: 19,
    from: { name: 'Real Betis', logo: teamLogo(543) },
    to: { name: 'Manchester City', logo: teamLogo(50) },
    fee: '35 M€',
    probability: 34,
    status: 'rumor',
  },
  {
    id: 'rumor-marin-napoli',
    kind: 'rumor',
    topic: 'Mercado',
    title: 'El Nápoles pregunta por Diego Marín',
    summary:
      'El delantero del Sevilla, de 27 años, es una de las alternativas que maneja el Nápoles para su ataque.',
    body: [
      'El Nápoles ha preguntado por la situación de Diego Marín. El delantero del Sevilla atraviesa un buen momento y su perfil de nueve móvil encaja en la idea de juego del equipo italiano.',
      'El Sevilla ha trasladado que solo escuchará ofertas cercanas a los 28 millones de euros. El Nápoles valora una cesión con obligación de compra, una fórmula que el club andaluz no descarta si se cumplen las condiciones.',
    ],
    source: 'Mercado AFFutbol',
    publishedHoursAgo: 12,
    player: 'Diego Marín',
    position: 'Delantero centro',
    age: 27,
    from: { name: 'Sevilla FC', logo: teamLogo(536) },
    to: { name: 'Napoli', logo: teamLogo(492) },
    fee: '28 M€',
    probability: 55,
    status: 'negociando',
  },
  {
    id: 'rumor-amrani-bayern',
    kind: 'rumor',
    topic: 'Mercado',
    title: 'El Bayern descarta a Youssef Amrani',
    summary:
      'El portero del Ajax no entra en los planes inmediatos del Bayern, que confía en su actual pareja de guardametas.',
    body: [
      'El Bayern ha descartado la incorporación de Youssef Amrani. El portero marroquí, de 21 años, había sonado como futuro recambio, pero el club bávaro considera que no es el momento de invertir en esa posición.',
      'El Ajax mantiene su confianza en el jugador y no tiene previsto negociar su salida en enero. Otros clubes de la Bundesliga y de la Premier podrían retomar la operación en verano.',
    ],
    source: 'Mercado AFFutbol',
    publishedHoursAgo: 22,
    player: 'Youssef Amrani',
    position: 'Portero',
    age: 21,
    from: { name: 'Ajax', logo: teamLogo(194) },
    to: { name: 'Bayern München', logo: teamLogo(157) },
    fee: '22 M€',
    probability: 12,
    status: 'descartado',
  },
  {
    id: 'rumor-nunes-barcelona',
    kind: 'rumor',
    topic: 'Mercado',
    title: 'El Barcelona estudia el fichaje de Thiago Nunes',
    summary:
      'El mediapunta portugués, de 25 años, es una de las opciones que el Barcelona tiene sobre la mesa para el mercado invernal.',
    body: [
      'El Barcelona ha vuelto a incluir a Thiago Nunes en su lista de posibles refuerzos. El mediapunta del Benfica ofrece llegada al área y último pase, dos cualidades que el equipo ha echado de menos en los partidos más cerrados.',
      'La operación no será sencilla: el Benfica no quiere vender y el Barcelona necesita liberar masa salarial antes de acometer cualquier fichaje. Por ahora, el interés existe pero no hay negociación formal.',
    ],
    source: 'Mercado AFFutbol',
    publishedHoursAgo: 30,
    player: 'Thiago Nunes',
    position: 'Mediapunta',
    age: 25,
    from: { name: 'Benfica', logo: teamLogo(211) },
    to: { name: 'Barcelona', logo: teamLogo(529) },
    fee: '70 M€',
    probability: 41,
    status: 'rumor',
  },
];
