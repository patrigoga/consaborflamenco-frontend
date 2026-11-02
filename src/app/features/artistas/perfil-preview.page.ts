import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PerfilContenidoComponent } from './perfil-contenido.component';
import { crearPerfilDemo } from './perfil-demo';
import { PerfilArtista, enlaceSeguro, idYoutube } from './perfil-artista.model';

type Pestana = 'perfil' | 'imagenes' | 'videos' | 'discos' | 'actuaciones' | 'redes';
const copiar = (p: PerfilArtista): PerfilArtista => JSON.parse(JSON.stringify(p));

@Component({
  selector: 'csf-perfil-preview', standalone: true, imports: [FormsModule, PerfilContenidoComponent],
  templateUrl: './perfil-preview.page.html', styleUrl: './perfil-preview.page.css'
})
export class PerfilPreviewPage {
  readonly editando = signal(false);
  readonly pestana = signal<Pestana>('perfil');
  readonly perfil = signal(crearPerfilDemo());
  borrador = copiar(this.perfil());
  readonly aviso = signal('');
  readonly error = signal('');
  readonly pestanas: { id: Pestana; nombre: string; detalle: string }[] = [
    { id: 'perfil', nombre: 'Mi perfil', detalle: 'Tu identidad y trayectoria' },
    { id: 'imagenes', nombre: 'Imágenes', detalle: 'Fotografías y créditos' },
    { id: 'videos', nombre: 'Vídeos', detalle: 'Tus enlaces de YouTube' },
    { id: 'discos', nombre: 'Discografía', detalle: 'Discos y lanzamientos' },
    { id: 'actuaciones', nombre: 'Actuaciones', detalle: 'Fechas, salas y entradas' },
    { id: 'redes', nombre: 'Redes y contacto', detalle: 'Tus canales oficiales' }
  ];
  private siguienteId = 100;
  readonly idYoutube = idYoutube;

  abrirEditor(): void { this.editando.set(true); this.aviso.set(''); }

  aplicar(): void {
    this.error.set('');
    const p = this.borrador;
    if (p.nombre.trim().length < 2 || !p.disciplina.trim() || !p.provincia.trim()) {
      this.pestana.set('perfil'); this.error.set('Completa el nombre, la disciplina y la provincia.'); return;
    }
    if (p.videos.some(v => v.url && !idYoutube(v.url))) {
      this.pestana.set('videos'); this.error.set('Revisa los enlaces: se admiten vídeos de youtube.com y youtu.be.'); return;
    }
    const enlaces: [Pestana, string[]][] = [
      ['discos', p.discos.map(d => d.enlace)], ['actuaciones', p.actuaciones.map(a => a.entradas)], ['redes', p.redes.map(r => r.url)]
    ];
    for (const [tab, urls] of enlaces) {
      if (urls.some(url => url && !enlaceSeguro(url))) {
        this.pestana.set(tab); this.error.set('Usa una dirección completa que empiece por https://.'); return;
      }
    }
    this.perfil.set(copiar({ ...p, nombre: p.nombre.trim() }));
    this.editando.set(false);
    this.aviso.set('Vista previa actualizada. Los cambios solo existen en esta pestaña y se perderán al recargar.');
  }

  agregar(tipo: Exclude<Pestana, 'perfil' | 'imagenes'>): void {
    const id = this.siguienteId++;
    if (tipo === 'videos') this.borrador.videos.push({ id, titulo: 'Nuevo vídeo', url: '' });
    if (tipo === 'discos') this.borrador.discos.push({ id, titulo: 'Nuevo lanzamiento', anio: '', portada: '', enlace: '' });
    if (tipo === 'actuaciones') this.borrador.actuaciones.push({ id, titulo: 'Nueva actuación', fecha: '', lugar: '', ciudad: '', entradas: '' });
    if (tipo === 'redes') this.borrador.redes.push({ id, nombre: 'Instagram', url: '' });
  }

  quitar(tipo: Exclude<Pestana, 'perfil'>, id: number): void {
    if (tipo === 'imagenes') this.borrador.imagenes = this.borrador.imagenes.filter(x => x.id !== id);
    if (tipo === 'videos') this.borrador.videos = this.borrador.videos.filter(x => x.id !== id);
    if (tipo === 'discos') this.borrador.discos = this.borrador.discos.filter(x => x.id !== id);
    if (tipo === 'actuaciones') this.borrador.actuaciones = this.borrador.actuaciones.filter(x => x.id !== id);
    if (tipo === 'redes') this.borrador.redes = this.borrador.redes.filter(x => x.id !== id);
  }

  async elegirImagen(evento: Event, destino: 'portada' | 'galeria' | number): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.error.set('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      this.error.set('Elige una imagen JPG, PNG o WebP de hasta 5 MB.'); input.value = ''; return;
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const lector = new FileReader(); lector.onload = () => resolve(String(lector.result)); lector.onerror = reject; lector.readAsDataURL(archivo);
      });
      if (destino === 'portada') this.borrador.portada = url;
      else if (destino === 'galeria') this.borrador.imagenes.push({ id: this.siguienteId++, url, titulo: archivo.name.replace(/\.[^.]+$/, ''), credito: '' });
      else { const disco = this.borrador.discos.find(x => x.id === destino); if (disco) disco.portada = url; }
      this.aviso.set('Imagen añadida a la demostración en este dispositivo; no se ha subido al servidor.');
    } catch { this.error.set('No se pudo leer la imagen. Prueba con otra.'); }
    input.value = '';
  }
}
