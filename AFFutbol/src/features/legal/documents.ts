/**
 * Legal copy shown in the app and, through the web build, at the public URLs
 * required by App Store Connect and Google Play:
 *
 *   https://affutbol.app/legal/privacidad
 *   https://affutbol.app/legal/terminos
 *   https://affutbol.app/legal/fuentes
 *
 * There is exactly one source of truth: this file. The routes under
 * `src/app/legal/` render it, so the in-app text and the public page can never
 * drift apart. Update `LEGAL_LAST_UPDATED` whenever the copy changes.
 *
 * This is not legal advice: run the final text past a lawyer before publishing,
 * and check `docs/publicacion/legales.md` for the details that must be filled in
 * (mailbox, hosting region, domain).
 */

export type LegalDocumentId = 'privacidad' | 'terminos' | 'fuentes';

export type LegalBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'link'; label: string; url: string };

export type LegalDocument = {
  id: LegalDocumentId;
  eyebrow: string;
  title: string;
  summary: string;
  blocks: LegalBlock[];
};

export const LEGAL_LAST_UPDATED = '10 de noviembre de 2026';

/** Must exist before submitting: see docs/publicacion/legales.md. */
export const LEGAL_CONTACT_EMAIL = 'privacidad@affutbol.app';
export const LEGAL_SUPPORT_EMAIL = 'soporte@affutbol.app';
export const LEGAL_SITE_URL = 'https://affutbol.app';

export const LEGAL_PUBLIC_PATHS = {
  privacidad: '/legal/privacidad',
  terminos: '/legal/terminos',
  fuentes: '/legal/fuentes',
} as const satisfies Record<LegalDocumentId, string>;

export function legalPublicUrl(id: LegalDocumentId): string {
  return `${LEGAL_SITE_URL}${LEGAL_PUBLIC_PATHS[id]}`;
}

const PRIVACIDAD: LegalDocument = {
  id: 'privacidad',
  eyebrow: 'Legal',
  title: 'Política de privacidad',
  summary:
    'Qué datos guarda AFFutbol, para qué los usa, cuánto tiempo los conserva y cómo puedes borrarlos.',
  blocks: [
    {
      kind: 'paragraph',
      text: `Última actualización: ${LEGAL_LAST_UPDATED}.`,
    },
    {
      kind: 'heading',
      text: '1. Responsable del tratamiento',
    },
    {
      kind: 'paragraph',
      text: `AFFutbol es una aplicación desarrollada y mantenida por Alejandro Fernández Franco, con domicilio en España. Para cualquier consulta sobre tus datos personales puedes escribir a ${LEGAL_CONTACT_EMAIL}.`,
    },
    {
      kind: 'heading',
      text: '2. Qué datos tratamos',
    },
    {
      kind: 'paragraph',
      text: 'Solo guardamos lo necesario para que la app funcione:',
    },
    {
      kind: 'bullets',
      items: [
        'Cuenta: dirección de correo electrónico, contraseña (guardada como hash por Supabase Auth, nunca en claro), nombre visible, nombre de usuario, equipo favorito y, si entras con Google o Apple, la URL pública de tu foto de perfil.',
        'Pronósticos: partido, marcador pronosticado, puntos obtenidos y fecha de liquidación.',
        'Ligas privadas: nombre de la liga, código de invitación y tu papel en ella (propietario o miembro).',
        'Rankings: posición y puntos calculados a partir de tus pronósticos.',
        'Notificaciones push (solo si las activas): token del dispositivo que emite Expo, plataforma, nombre del dispositivo, versión de la app, preferencias de aviso, último contacto del token y un registro de los avisos enviados para no repetirlos.',
        'Datos técnicos mínimos que procesa el proveedor de infraestructura (por ejemplo, dirección IP y registros de acceso) para servir la app y protegerse de abusos.',
        'Contenido editorial y estadísticas: no son datos personales. AFFutbol guarda los titulares y extractos que publican los medios y las clasificaciones de las competiciones.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'AFFutbol no usa publicidad, ni herramientas de analítica, ni rastreadores de terceros. No creamos perfiles publicitarios ni vendemos datos.',
    },
    {
      kind: 'heading',
      text: '3. Para qué usamos los datos y con qué base legal',
    },
    {
      kind: 'bullets',
      items: [
        'Ejecutar el servicio que has pedido (art. 6.1.b del RGPD): crear tu cuenta, guardar tus pronósticos y tu equipo, calcular tus puntos y mostrarte los rankings y las ligas.',
        'Enviar notificaciones push (art. 6.1.a, consentimiento): solo si las activas en Perfil. Puedes desactivarlas cuando quieras desde la propia app o desde los ajustes del sistema, sin que ello afecte al resto del servicio.',
        'Mantener la seguridad y prevenir abusos (art. 6.1.f, interés legítimo): proteger las cuentas, limitar el uso automatizado y evitar que se alteren los puntos.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Los puntos de los pronósticos se calculan automáticamente con las reglas del juego (10 puntos por marcador exacto, 5 por acertar los goles de un equipo y 0 en el resto de casos). No se toman decisiones automatizadas que produzcan efectos jurídicos sobre ti.',
    },
    {
      kind: 'heading',
      text: '4. Quién puede ver tus datos',
    },
    {
      kind: 'paragraph',
      text: 'Tus datos se guardan en Supabase, que actúa como proveedor de infraestructura (autenticación, base de datos y funciones del servidor) y trata los datos siguiendo nuestras instrucciones. También usamos estos servicios, solo para lo que se indica:',
    },
    {
      kind: 'bullets',
      items: [
        'Supabase: alojamiento de la cuenta, la base de datos y las funciones del servidor. El proyecto está alojado en la región configurada en Supabase; si necesitas el detalle exacto, escríbenos.',
        'Expo: entrega de las notificaciones push al dispositivo, únicamente cuando las activas.',
        'Google y Apple: si decides iniciar sesión con ellos, nos facilitan tu identificador y tu correo. El uso que hacen de tus datos se rige por sus propias políticas.',
        'Medios de comunicación: la app abre enlaces a sus páginas. No les enviamos tus datos de cuenta; a partir de ese momento se aplica su política de privacidad.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese caso se apoyan en las garantías previstas por el RGPD (por ejemplo, las cláusulas contractuales tipo de la Comisión Europea). No cedemos datos a terceros para publicidad ni los vendemos.',
    },
    {
      kind: 'heading',
      text: '5. Cuánto tiempo los conservamos',
    },
    {
      kind: 'bullets',
      items: [
        'Datos de la cuenta, pronósticos, ligas y rankings: mientras tu cuenta exista. Si la eliminas, se borran de inmediato (ver el apartado 6).',
        'Token de notificaciones: hasta que desactivas los avisos, cierras sesión o eliminas tu cuenta.',
        'Noticias y rumores: 14 días, aunque no contienen datos personales.',
        'Copias de seguridad del proveedor: cifradas y con una rotación máxima de 7 días.',
      ],
    },
    {
      kind: 'heading',
      text: '6. Cómo eliminar tu cuenta',
    },
    {
      kind: 'paragraph',
      text: 'Puedes borrar tu cuenta y todos sus datos desde la propia app: Perfil → Eliminar cuenta. Se te pedirá que escribas ELIMINAR para confirmar. Al hacerlo se borran en el momento tu correo, tu perfil (nombre, usuario, equipo favorito y foto), tus pronósticos y puntos, las ligas privadas que hayas creado (también para sus miembros), tu pertenencia a otras ligas, el registro de tus notificaciones y su token.',
    },
    {
      kind: 'paragraph',
      text: `Si no puedes acceder a la app, escribe a ${LEGAL_CONTACT_EMAIL} desde el correo de tu cuenta y la eliminaremos en un plazo máximo de 30 días.`,
    },
    {
      kind: 'heading',
      text: '7. Tus derechos',
    },
    {
      kind: 'paragraph',
      text: 'Puedes pedir acceso a tus datos, rectificarlos, suprimirlos, oponerte a un tratamiento, limitarlo o solicitar su portabilidad. También puedes retirar en cualquier momento el consentimiento para las notificaciones push. Para ejercer estos derechos escribe a ' +
        LEGAL_CONTACT_EMAIL +
        ' indicando el correo de tu cuenta. Si consideras que no hemos atendido tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (AEPD).',
    },
    { kind: 'link', label: 'Agencia Española de Protección de Datos (AEPD)', url: 'https://www.aepd.es' },
    {
      kind: 'heading',
      text: '8. Menores de edad',
    },
    {
      kind: 'paragraph',
      text: 'AFFutbol no está dirigida a menores de 14 años. En España, la edad mínima para consentir el tratamiento de datos personales por sí mismo es de 14 años (artículo 7 de la LOPDGDD). Si detectamos una cuenta de un menor de esa edad, la eliminaremos.',
    },
    {
      kind: 'heading',
      text: '9. Seguridad',
    },
    {
      kind: 'paragraph',
      text: 'La app se conecta siempre mediante HTTPS. Las contraseñas se guardan con hash y nunca se muestran. La base de datos aplica reglas de acceso por fila (RLS): cada usuario solo puede leer y escribir sus propios datos. Las claves con privilegios de administración permanecen en el servidor y no se incluyen en la app. Ningún sistema es infalible, pero si se produjera un incidente que afecte a tus derechos, te informaremos y lo notificaremos a la AEPD cuando corresponda.',
    },
    {
      kind: 'heading',
      text: '10. Cambios en esta política',
    },
    {
      kind: 'paragraph',
      text: 'Si cambiamos cómo tratamos tus datos, actualizaremos esta página y la fecha de la cabecera. Cuando el cambio sea relevante, lo avisaremos en la app antes de aplicarlo.',
    },
    {
      kind: 'heading',
      text: '11. Contacto',
    },
    {
      kind: 'paragraph',
      text: `Para dudas sobre privacidad: ${LEGAL_CONTACT_EMAIL}. Para problemas con la app: ${LEGAL_SUPPORT_EMAIL}.`,
    },
  ],
};

const TERMINOS: LegalDocument = {
  id: 'terminos',
  eyebrow: 'Legal',
  title: 'Condiciones de uso',
  summary: 'Las reglas de uso de AFFutbol: cuenta, pronósticos, rankings, ligas privadas y contenido.',
  blocks: [
    {
      kind: 'paragraph',
      text: `Última actualización: ${LEGAL_LAST_UPDATED}.`,
    },
    {
      kind: 'heading',
      text: '1. Qué es AFFutbol',
    },
    {
      kind: 'paragraph',
      text: 'AFFutbol es una aplicación gratuita para seguir la actualidad del fútbol y competir con otras personas haciendo pronósticos del marcador de los partidos de tu equipo favorito. No es un servicio de apuestas, no se juega dinero y no hay premios en metálico ni en especie.',
    },
    {
      kind: 'paragraph',
      text: 'Al crear una cuenta o usar la app aceptas estas condiciones y la política de privacidad. Si no estás de acuerdo, no uses el servicio.',
    },
    {
      kind: 'heading',
      text: '2. Tu cuenta',
    },
    {
      kind: 'bullets',
      items: [
        'Debes tener al menos 14 años y facilitar un correo electrónico que sea tuyo.',
        'Una cuenta por persona. No puedes crear cuentas para manipular rankings ni suplantar a otra persona.',
        'Eres responsable de mantener tu contraseña a salvo y de la actividad de tu cuenta.',
        'Puedes eliminar tu cuenta cuando quieras desde Perfil → Eliminar cuenta. La baja es inmediata e irreversible.',
      ],
    },
    {
      kind: 'heading',
      text: '3. Uso aceptable',
    },
    {
      kind: 'paragraph',
      text: 'No puedes usar AFFutbol para:',
    },
    {
      kind: 'bullets',
      items: [
        'Automatizar peticiones, extraer datos de forma masiva o intentar acceder a cuentas o datos de otras personas.',
        'Alterar los puntos, los rankings o el resultado de los partidos, incluida la explotación de errores.',
        'Publicar en nombres de usuario o de liga contenido ilegal, ofensivo o que vulnere derechos de terceros.',
        'Revender el servicio o presentarlo como propio.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Si detectamos un uso abusivo podemos suspender o cancelar la cuenta, avisándote cuando sea posible.',
    },
    {
      kind: 'heading',
      text: '4. Pronósticos y puntos',
    },
    {
      kind: 'bullets',
      items: [
        'Puedes pronosticar el marcador de los partidos de tu equipo favorito hasta el inicio del partido. Después, el pronóstico queda bloqueado.',
        'Puntuación: 10 puntos por acertar el marcador exacto, 5 puntos por acertar los goles de solo uno de los dos equipos y 0 puntos en el resto de casos.',
        'Los puntos se calculan automáticamente cuando termina el partido, con el resultado oficial que publica el proveedor de datos.',
        'Si un partido se aplaza, se suspende o no se puede verificar el resultado, el pronóstico se anula y no reparte puntos.',
        'Un mismo usuario puede tener un único pronóstico por partido.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'AFFutbol puede corregir errores evidentes de cálculo o de datos. Las clasificaciones no son un título oficial ni sustituyen a las de las competiciones.',
    },
    {
      kind: 'heading',
      text: '5. Rankings y ligas privadas',
    },
    {
      kind: 'bullets',
      items: [
        'El ranking mundial incluye a los usuarios con al menos un pronóstico. Puedes aparecer con tu nombre de usuario y tus puntos.',
        'Cualquier usuario puede crear una liga privada y compartir su código de invitación. Quien crea la liga puede expulsar a miembros y, si elimina su cuenta, la liga desaparece para todos.',
        'Los códigos de invitación son la única forma de entrar en una liga privada: compártelos solo con quien quieras.',
        'El nombre que elijas para tu liga será visible para sus miembros. No uses contenido ofensivo.',
      ],
    },
    {
      kind: 'heading',
      text: '6. Notificaciones',
    },
    {
      kind: 'paragraph',
      text: 'Los avisos push son opcionales y puedes desactivarlos por tipo en Perfil → Notificaciones. AFFutbol no envía publicidad por este canal.',
    },
    {
      kind: 'heading',
      text: '7. Contenido de terceros',
    },
    {
      kind: 'paragraph',
      text: 'Las noticias y rumores son titulares, extractos e imágenes que publican medios de comunicación, con un enlace al artículo original. El contenido pertenece a sus autores; AFFutbol no lo reproduce completo ni lo modifica. Los escudos, imágenes de clubes y nombres de competiciones son marcas de sus titulares y se usan únicamente para identificar a los equipos. AFFutbol no está afiliada a LaLiga, la RFEF, la UEFA, la FIFA ni a ningún club.',
    },
    {
      kind: 'paragraph',
      text: 'Los datos de partidos y clasificaciones provienen de API-Football y football-data.org, y la tabla de goleadores de la Wikipedia en inglés. Consulta la página de fuentes y atribución para ver los detalles.',
    },
    {
      kind: 'paragraph',
      text: 'Si eres titular de derechos y crees que un contenido te perjudica, escríbenos y lo retiraremos.',
    },
    {
      kind: 'heading',
      text: '8. Propiedad intelectual de la app',
    },
    {
      kind: 'paragraph',
      text: 'El nombre AFFutbol, el logotipo, el diseño y el código de la app pertenecen a su autor. Recibes una licencia personal, no exclusiva y no transferible para usar la app, sin derecho a copiarla, modificarla, descompilarla ni redistribuirla salvo que la ley lo permita.',
    },
    {
      kind: 'heading',
      text: '9. Disponibilidad y responsabilidad',
    },
    {
      kind: 'paragraph',
      text: 'AFFutbol se ofrece «tal cual» y de forma gratuita. No garantizamos que el servicio esté siempre disponible ni que los datos de terceros (horarios, marcadores, clasificaciones o noticias) sean exactos o estén completos. Podemos suspender el servicio por mantenimiento o por causas ajenas a nuestro control.',
    },
    {
      kind: 'paragraph',
      text: 'En la medida en que la ley lo permita, no respondemos de daños indirectos derivados del uso de la app. Nada de lo anterior limita los derechos que te reconoce la normativa de consumo.',
    },
    {
      kind: 'heading',
      text: '10. Cambios y terminación',
    },
    {
      kind: 'paragraph',
      text: 'Podemos actualizar estas condiciones o el servicio. Si el cambio es importante, lo avisaremos en la app. Puedes dejar de usar AFFutbol y eliminar tu cuenta en cualquier momento. Podemos cerrar una cuenta que incumpla estas condiciones, avisándote cuando sea posible.',
    },
    {
      kind: 'heading',
      text: '11. Ley aplicable',
    },
    {
      kind: 'paragraph',
      text: 'Estas condiciones se rigen por la ley española. Si eres consumidor, puedes acudir a los juzgados de tu domicilio y a la normativa de resolución de litigios en línea que te ampare.',
    },
    {
      kind: 'heading',
      text: '12. Contacto',
    },
    {
      kind: 'paragraph',
      text: `Dudas sobre estas condiciones: ${LEGAL_SUPPORT_EMAIL}. Datos personales: ${LEGAL_CONTACT_EMAIL}.`,
    },
  ],
};

const FUENTES: LegalDocument = {
  id: 'fuentes',
  eyebrow: 'Legal',
  title: 'Fuentes y atribución',
  summary: 'De dónde salen los datos y las noticias de AFFutbol y quién es su titular.',
  blocks: [
    {
      kind: 'paragraph',
      text: 'AFFutbol no inventa datos: los partidos, las clasificaciones, los goleadores y las noticias vienen de los servicios que se indican a continuación. Sin ellos la app no sería posible, así que aquí está su reconocimiento.',
    },
    {
      kind: 'heading',
      text: 'Partidos y estadísticas de juego',
    },
    {
      kind: 'paragraph',
      text: 'Los calendarios, marcadores, eventos, alineaciones y estadísticas de cada partido proceden de API-Football (api-sports.io). Los datos se consultan a través de un servicio intermedio propio y no se redistribuyen como base de datos.',
    },
    { kind: 'link', label: 'API-Football', url: 'https://www.api-football.com/' },
    {
      kind: 'heading',
      text: 'Clasificaciones',
    },
    {
      kind: 'paragraph',
      text: 'Las clasificaciones de LaLiga, Premier League, Serie A y Bundesliga proceden de football-data.org. El servicio gratuito exige indicar su autoría; es la que aparece en la app.',
    },
    {
      kind: 'paragraph',
      text: '«Football data provided by the Football-Data.org API».',
    },
    { kind: 'link', label: 'football-data.org', url: 'https://www.football-data.org/' },
    {
      kind: 'heading',
      text: 'Goleadores',
    },
    {
      kind: 'paragraph',
      text: 'La tabla de máximos goleadores se elabora a partir de la sección «Top goalscorers» del artículo de la temporada en la Wikipedia en inglés. El texto de Wikipedia se publica bajo la licencia Creative Commons Atribución-CompartirIgual 4.0; AFFutbol extrae únicamente los datos numéricos (jugador, club y goles) y enlaza a la fuente.',
    },
    {
      kind: 'link',
      label: 'Licencia CC BY-SA 4.0',
      url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
    },
    { kind: 'link', label: 'Wikipedia en inglés', url: 'https://en.wikipedia.org/' },
    {
      kind: 'heading',
      text: 'Noticias y rumores',
    },
    {
      kind: 'paragraph',
      text: 'Los titulares, extractos e imágenes de actualidad proceden de los canales públicos (RSS) de Marca, Mundo Deportivo y Relevo. AFFutbol muestra un extracto y enlaza siempre al artículo original; nunca reproduce el texto completo. Los derechos pertenecen a cada medio.',
    },
    {
      kind: 'bullets',
      items: [
        'Si un medio cambia o retira su canal, sus noticias dejan de aparecer.',
        'Las noticias se conservan como máximo 14 días y se eliminan antes si el medio lo solicita.',
        'Las imágenes se enlazan desde el servidor del medio; no se copian a nuestros servidores.',
      ],
    },
    {
      kind: 'heading',
      text: 'Escudos, imágenes y marcas',
    },
    {
      kind: 'paragraph',
      text: 'Los escudos de los clubes, las fotografías de los jugadores y los nombres de las competiciones son marcas o contenidos de sus respectivos titulares. Se usan solo para identificar a los equipos dentro de la app, sin sugerir patrocinio ni afiliación.',
    },
    {
      kind: 'heading',
      text: 'Aviso de no afiliación',
    },
    {
      kind: 'paragraph',
      text: 'AFFutbol es un proyecto independiente. No está afiliada ni patrocinada por LaLiga, la RFEF, la UEFA, la FIFA, la Premier League, la Serie A, la Bundesliga ni por ninguno de los clubes que aparecen en la app.',
    },
    {
      kind: 'heading',
      text: 'Retirada de contenido',
    },
    {
      kind: 'paragraph',
      text: `Si eres titular de derechos y consideras que un contenido debería retirarse, escribe a ${LEGAL_SUPPORT_EMAIL} indicando el enlace y el motivo. Lo revisaremos y, si procede, lo eliminaremos lo antes posible.`,
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  privacidad: PRIVACIDAD,
  terminos: TERMINOS,
  fuentes: FUENTES,
};

export function getLegalDocument(id: LegalDocumentId): LegalDocument {
  return LEGAL_DOCUMENTS[id];
}

/** Order used by the legal link lists. */
export const LEGAL_DOCUMENT_IDS: LegalDocumentId[] = ['privacidad', 'terminos', 'fuentes'];
