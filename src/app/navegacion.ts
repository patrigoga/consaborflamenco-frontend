/**
 * Mapa único de la web pública: menú, pie, rutas, prerenderizado y SEO salen de aquí.
 * Para añadir una sección: añádela a SECCIONES y a NAVEGACION, y crea su página.
 */
export const SITIO_URL = 'https://consaborflamenco.com';
export const NOMBRE_SITIO = 'ConSaborFlamenco';

export interface Seccion {
  ruta: string;          // URL absoluta dentro de la web, p. ej. '/revista/artistas'
  menu: string;          // texto del enlace en el menú
  titulo: string;        // <title> (se completa con «| ConSaborFlamenco»)
  h1: string;            // encabezado principal de la página
  descripcion: string;   // <meta name="description">
}

const s = (ruta: string, menu: string, titulo: string, h1: string, descripcion: string): Seccion =>
  ({ ruta, menu, titulo, h1, descripcion });

export const SECCIONES = {
  historia: s('/flamenco/historia', 'Historia', 'Historia del flamenco', 'Historia del flamenco',
    'El origen y la evolución del flamenco: épocas, lugares y figuras que han dado forma al arte jondo.'),
  palos: s('/flamenco/palos', 'Palos', 'Palos del flamenco', 'Los palos del flamenco',
    'Soleá, seguiriya, bulería, tangos, alegrías… los estilos del flamenco, su compás y su carácter.'),
  llaves: s('/flamenco/llaves-de-oro', 'Llaves de Oro', 'Llaves de Oro del flamenco', 'Llaves de Oro',
    'Las Llaves de Oro del flamenco: el reconocimiento y quienes lo han recibido.'),
  artistas: s('/revista/artistas', 'Artistas', 'Artistas flamencos', 'Artistas',
    'Cantaores, bailaores, guitarristas y músicos flamencos. Búscalos por provincia y disciplina.'),
  academias: s('/revista/academias', 'Academias', 'Academias de flamenco', 'Academias',
    'Academias y escuelas para aprender cante, baile y guitarra flamenca, por provincia.'),
  fotografia: s('/revista/fotografia', 'Fotografía', 'Fotografía flamenca', 'Fotografía',
    'Fotógrafos y trabajos fotográficos dedicados al flamenco.'),
  moda: s('/revista/moda', 'Moda', 'Moda flamenca', 'Moda flamenca',
    'Diseñadores, talleres y firmas de moda flamenca.'),
  penas: s('/revista/penas', 'Peñas', 'Peñas flamencas', 'Peñas flamencas',
    'Peñas flamencas: su actividad, recitales y la afición que las mantiene vivas.'),
  tablaos: s('/revista/tablaos', 'Tablaos', 'Tablaos flamencos', 'Tablaos',
    'Tablaos donde ver flamenco en directo.'),
  festivales: s('/revista/festivales', 'Festivales', 'Festivales flamencos', 'Festivales',
    'Festivales flamencos: programación, fechas y lugares.'),
  eventos: s('/eventos', 'Eventos', 'Agenda flamenca', 'Próximos eventos',
    'Agenda de espectáculos, recitales y festivales flamencos verificados.'),
  servicios: s('/servicios', 'Servicios', 'Servicios', 'Servicios',
    'Servicios de ConSaborFlamenco para artistas, academias y entidades del flamenco.'),
  contacto: s('/contacto', 'Contacto', 'Contacto', 'Contacto',
    'Cómo ponerte en contacto con ConSaborFlamenco.'),
  membresias: s('/membresias', 'Hazte miembro', 'Hazte miembro', 'Hazte miembro',
    'Membresías para profesionales del flamenco: publica tu perfil y tu actividad en ConSaborFlamenco.')
} as const;

export type ClaveSeccion = keyof typeof SECCIONES;

export interface EnlaceNav { texto: string; ruta: string; exacto?: boolean; }
export interface GrupoNav { texto: string; base: string; hijos: EnlaceNav[]; }
export type ElementoNav = EnlaceNav | GrupoNav;

const enlace = (c: ClaveSeccion): EnlaceNav => ({ texto: SECCIONES[c].menu, ruta: SECCIONES[c].ruta });

export const FLAMENCO: GrupoNav = { texto: 'Flamenco', base: '/flamenco', hijos: [enlace('historia'), enlace('palos'), enlace('llaves')] };
export const REVISTA: GrupoNav = {
  texto: 'Revista', base: '/revista',
  hijos: [enlace('artistas'), enlace('academias'), enlace('fotografia'), enlace('moda'), enlace('penas'), enlace('tablaos'), enlace('festivales')]
};

export const NAVEGACION: ElementoNav[] = [
  { texto: 'Inicio', ruta: '/', exacto: true },
  FLAMENCO,
  REVISTA,
  enlace('eventos'),
  enlace('servicios'),
  enlace('contacto')
];

export const MEMBRESIA: EnlaceNav = enlace('membresias');

export const esGrupo = (e: ElementoNav): e is GrupoNav => 'hijos' in e;

/** Rutas públicas que se prerenderizan en la compilación (sin la barra inicial). */
export const RUTAS_PRERENDER: string[] = ['', ...Object.values(SECCIONES).map(x => x.ruta.slice(1))];
