import { PerfilArtista } from './perfil-artista.model';

/** Contenido ficticio exclusivo de /vista-previa/artista; nunca se mezcla con la API. */
export function crearPerfilDemo(): PerfilArtista {
  const guitarra = 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&q=85';
  const escenario = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&q=85';
  return {
    id: 0, nombre: 'Nombre del artista', slug: 'artista-de-muestra', disciplina: 'Guitarra', provincia: 'Sevilla',
    biografia: 'Hay historias que se cuentan con seis cuerdas. Aquí, el artista podrá presentar su trayectoria, sus raíces y su forma de entender el flamenco.\n\nEste texto es un ejemplo de diseño: la biografía real la escribirá cada profesional desde su espacio personal.',
    fotoUrl: guitarra, portada: guitarra, destacado: false, frase: 'Una vida dedicada al compás.',
    imagenes: [
      { id: 1, url: guitarra, titulo: 'Entre cuerdas', credito: 'Imagen de referencia · Unsplash' },
      { id: 2, url: escenario, titulo: 'El arte en directo', credito: 'Imagen de referencia · Unsplash' }
    ],
    videos: [{ id: 3, titulo: 'Tu actuación en YouTube', url: '' }],
    discos: [
      { id: 4, titulo: 'Título de tu primer disco', anio: '2025', portada: '', enlace: '' },
      { id: 5, titulo: 'Tu próximo lanzamiento', anio: '2026', portada: '', enlace: '' }
    ],
    actuaciones: [{ id: 6, titulo: 'Tu próximo recital', fecha: '', lugar: 'Nombre del espacio', ciudad: 'Sevilla', entradas: '' }],
    redes: [{ id: 7, nombre: 'Instagram', url: '' }, { id: 8, nombre: 'Web oficial', url: '' }]
  };
}
