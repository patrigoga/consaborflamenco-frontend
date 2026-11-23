import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, catchError, of, switchMap } from 'rxjs';
import { AdminApiService } from '../core/admin-api.service';
import { AuthService } from '../core/auth.service';
import { AvisosService } from '../core/avisos.service';
import { mensajeDe } from '../core/errores';
import { ArtistaAdmin } from '../core/modelos';
import { RetratoComponent } from '../ui/retrato.component';
import { Protagonista, ProtagonistasService } from '../../home/protagonistas.service';

@Component({
  selector: 'adm-destacados',
  standalone: true,
  imports: [RouterLink, RetratoComponent],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Destacados en portada</h1>
        <p class="adm-subtitulo">Selecciona artistas publicados directamente en la lista. Destacado: máximo {{ max() }}. Muy destacado: solo uno para la cabecera.</p>
      </div>
    </header>
    @if (error()) { <p class="adm-alerta" role="alert">{{ error() }}</p> }
    @if (aviso()) { <p class="adm-nota" role="status">{{ aviso() }}</p> }

    <section class="adm-bloque" aria-label="Seleccionar artistas destacados">
      <div class="adm-bloque__cabecera">
        <h2 class="adm-bloque__titulo">Artistas publicados</h2>
        <span>{{ destacados().length }} / {{ max() }} destacados</span>
      </div>
      <label class="adm-filtros__buscar adm-filtros__buscar--ancho">
        <span class="adm-oculto">Buscar artistas publicados</span>
        <input type="search" placeholder="Buscar por nombre…" (input)="busqueda.next($any($event.target).value)" maxlength="100">
      </label>
      <div class="adm-grid-artistas">
        @for (a of artistas(); track a.id) {
          <article class="adm-artista-opcion">
            <adm-retrato [url]="a.fotoUrl" [nombre]="a.nombre" />
            <div class="adm-artista-opcion__datos">
              <a [routerLink]="['/admin/artistas', a.id]" class="adm-candidatos__nombre">{{ a.nombre }}</a>
              <small>{{ a.disciplina }} · {{ a.provincia }}</small>
              @if (esMuyDestacado(a)) { <strong class="adm-artista-opcion__estado">Protagonista de cabecera</strong> }
            </div>
            <div class="adm-artista-opcion__acciones">
              <button type="button" class="adm-btn adm-btn--peq" [disabled]="ocupado() !== null || (!a.destacado && destacados().length >= max())"
                      [attr.aria-pressed]="a.destacado" (click)="cambiarDestacado(a)">
                {{ a.destacado ? 'Quitar destacado' : 'Destacado' }}
              </button>
              @if (auth.esPrincipal()) {
                <button type="button" class="adm-btn adm-btn--peq"
                        [disabled]="ocupado() !== null || !a.fotoUrl"
                        [attr.aria-pressed]="esMuyDestacado(a)" (click)="cambiarMuyDestacado(a)">
                  {{ esMuyDestacado(a) ? 'Quitar muy destacado' : 'Muy destacado' }}
                </button>
              }
            </div>
          </article>
        } @empty {
          @if (cargado()) {
            <p class="adm-nota">No se encontraron artistas publicados. Puedes crearlos desde <a routerLink="/admin/artistas">Artistas</a>.</p>
          }
        }
      </div>
      <p class="adm-nota">Al seleccionar otro artista como muy destacado, sustituirá automáticamente al anterior. No afecta a los destacados normales.</p>
    </section>
    @if (auth.esPrincipal() && protagonista(); as p) {
      <section class="adm-bloque" aria-label="Imagen exclusiva de cabecera">
        <h2>Imagen de cabecera · {{ p.titulo }}</h2>
        <p class="adm-nota">La fotografía de la tarjeta se conserva. Sube una segunda imagen PNG con fondo transparente para colocarla sobre el fondo de la cabecera.</p>
        <div class="adm-cabecera-preview" [class.adm-cabecera-preview--recorte]="!!p.imagenCabeceraUrl">
          @if (p.imagenCabeceraUrl) {
            <img [src]="p.imagenCabeceraUrl" [alt]="'Vista previa de ' + p.titulo"
              [style.right.%]="5 + (50 - posX) * 0.65"
              [style.transform]="'translateY(' + ((50 - posY) * 0.6) + '%) scale(' + (escala / 100) + ')'">
          } @else {
            <img [src]="p.imagenUrl" [alt]="'Fotografía actual de ' + p.titulo" class="adm-cabecera-preview__clasica">
          }
          <div class="adm-cabecera-preview__texto"><strong>{{ p.titulo }}</strong><span>{{ p.descripcion }}</span></div>
        </div>
        <label class="adm-cabecera-upload">Imagen independiente (PNG transparente, máximo 5 MB)
          <input type="file" accept="image/png,.png" [disabled]="subiendoImagen()" (change)="subirImagen($event)">
        </label>
        @if (p.imagenCabeceraUrl) {
          <div class="adm-cabecera-ajustes">
            <label>Posición horizontal: {{ posX }} %
              <input type="range" min="0" max="100" [(value)]="posX" (input)="posX = +$any($event.target).value">
            </label>
            <label>Posición vertical: {{ posY }} %
              <input type="range" min="0" max="100" [(value)]="posY" (input)="posY = +$any($event.target).value">
            </label>
            <label>Escala: {{ escala }} %
              <input type="range" min="50" max="180" [(value)]="escala" (input)="escala = +$any($event.target).value">
            </label>
            <div class="adm-cabecera-acciones">
              <button type="button" class="adm-btn adm-btn--oro" [disabled]="subiendoImagen()" (click)="guardarEncuadre()">Guardar encuadre</button>
              <button type="button" class="adm-btn adm-btn--peq" [disabled]="subiendoImagen()" (click)="quitarImagen()">Quitar imagen de cabecera</button>
            </div>
          </div>
        }
      </section>
    }
  `,
  styles: [`
    .adm-grid-artistas { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr)); gap:14px; margin-top:16px; }
    .adm-artista-opcion { display:flex; gap:12px; flex-wrap:wrap; align-items:center; padding:14px; border:1px solid #bca782; border-radius:9px; min-width:0; }
    .adm-artista-opcion__datos { flex:1 1 140px; min-width:0; display:flex; flex-direction:column; gap:5px; }
    .adm-artista-opcion__datos small { color:#76695a; }
    .adm-artista-opcion__estado { color:#95601b; font-size:.8rem; }
    .adm-artista-opcion__acciones { display:flex; gap:8px; flex-wrap:wrap; width:100%; }
    .adm-artista-opcion__acciones button { flex:1; }
    .adm-cabecera-preview{height:260px;position:relative;overflow:hidden;border-radius:10px;margin:16px 0;background:radial-gradient(circle at 70% 40%,#664024,#1e130d 65%,#0f0c0a)}
    .adm-cabecera-preview>img{height:100%;width:55%;position:absolute;right:0;bottom:0;object-fit:contain;object-position:center bottom}
    .adm-cabecera-preview>img.adm-cabecera-preview__clasica{object-fit:cover}
    .adm-cabecera-preview__texto{position:absolute;z-index:2;top:35%;left:5%;display:grid;gap:8px;max-width:55%;color:#fff;text-shadow:0 2px 15px #000}
    .adm-cabecera-preview__texto strong{font:32px Georgia,serif}
    .adm-cabecera-preview__texto span{font-size:13px}
    .adm-cabecera-upload{display:grid;gap:8px;margin:12px 0}
    .adm-cabecera-ajustes{display:grid;gap:12px}
    .adm-cabecera-ajustes label{display:grid;gap:5px;max-width:400px}
    .adm-cabecera-acciones{display:flex;gap:12px;flex-wrap:wrap}

  `]
})
export class DestacadosComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AdminApiService);
  private readonly protagonistasApi = inject(ProtagonistasService);
  private readonly avisos = inject(AvisosService);

  readonly destacados = signal<ArtistaAdmin[]>([]);
  readonly artistas = signal<ArtistaAdmin[]>([]);
  readonly protagonista = signal<Protagonista | null>(null);
  readonly max = signal(6);
  readonly ocupado = signal<number | null>(null);
  readonly cargado = signal(false);
  readonly error = signal<string | null>(null);
  readonly aviso = signal('');
  readonly busqueda = new Subject<string>();
  readonly subiendoImagen = signal(false);
  posX = 50;
  posY = 50;
  escala = 100;
  private texto = '';

  constructor() {
    this.busqueda.pipe(
      debounceTime(250),
      switchMap(q => { this.texto = q.trim(); return this.buscarArtistas(); }),
      takeUntilDestroyed()
    ).subscribe(l => this.artistas.set(l));
  }

  ngOnInit(): void {
    this.api.catalogos().subscribe({ next: c => this.max.set(c.maxDestacados), error: () => {} });
    this.recargar();
    this.protagonistasApi.listar().subscribe({
      next: lista => this.actualizarProtagonista(lista.find(p => p.tipo === 'ARTISTA') ?? null),
      error: () => this.error.set('No se pudo cargar el artista protagonista.')
    });
  }

  private actualizarProtagonista(p: Protagonista | null): void {
    this.protagonista.set(p);
    this.posX = p?.cabeceraPosX ?? 50;
    this.posY = p?.cabeceraPosY ?? 50;
    this.escala = p?.cabeceraEscala || 100;
  }

  subirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    if (archivo.type !== 'image/png' || archivo.size > 5 * 1024 * 1024) {
      this.error.set('Selecciona una imagen PNG transparente de hasta 5 MB.');
      input.value = '';
      return;
    }
    this.subiendoImagen.set(true); this.error.set(null);
    this.protagonistasApi.subirImagenCabecera(archivo).subscribe({
      next: p => { this.actualizarProtagonista(p); this.subiendoImagen.set(false);
        this.aviso.set('Imagen de cabecera guardada. La tarjeta conserva su fotografía original.'); input.value = ''; },
      error: () => { this.subiendoImagen.set(false); this.error.set('No se pudo subir. Comprueba que el PNG tenga transparencia real.'); input.value = ''; }
    });
  }

  guardarEncuadre(): void {
    this.subiendoImagen.set(true);
    this.protagonistasApi.guardarAjustesCabecera(this.posX, this.posY, this.escala).subscribe({
      next: p => { this.actualizarProtagonista(p); this.subiendoImagen.set(false); this.aviso.set('Encuadre actualizado.'); },
      error: () => { this.subiendoImagen.set(false); this.error.set('No se pudo guardar el encuadre.'); }
    });
  }

  quitarImagen(): void {
    this.subiendoImagen.set(true);
    this.protagonistasApi.quitarImagenCabecera().subscribe({
      next: p => { this.actualizarProtagonista(p); this.subiendoImagen.set(false); this.aviso.set('Imagen especial retirada; se conserva la fotografía de tarjeta.'); },
      error: () => { this.subiendoImagen.set(false); this.error.set('No se pudo retirar la imagen especial.'); }
    });
  }

  esMuyDestacado(a: ArtistaAdmin): boolean {
    const p = this.protagonista();
    return !!p && p.titulo === a.nombre && p.imagenUrl === a.fotoUrl;
  }

  recargar(): void {
    this.api.destacados().subscribe({
      next: l => this.destacados.set(l),
      error: e => this.error.set(mensajeDe(e, 'No se han podido cargar los destacados.'))
    });
    this.buscarArtistas().subscribe(l => { this.artistas.set(l); this.cargado.set(true); });
  }

  cambiarDestacado(a: ArtistaAdmin): void {
    this.ocupado.set(a.id);
    const accion = a.destacado ? 'quitar-destacado' : 'destacar';
    this.api.accion(a.id, accion).subscribe({
      next: () => {
        this.ocupado.set(null);
        this.avisos.ok(a.destacado ? `${a.nombre} deja de estar destacado.` : `${a.nombre} está destacado.`);
        this.recargar();
      },
      error: e => { this.ocupado.set(null); this.avisos.error(mensajeDe(e)); }
    });
  }

  cambiarMuyDestacado(a: ArtistaAdmin): void {
    this.ocupado.set(a.id);
    if (this.esMuyDestacado(a)) {
      this.protagonistasApi.eliminar('ARTISTA').subscribe({
        next: () => { this.actualizarProtagonista(null); this.ocupado.set(null); this.aviso.set('Artista retirado de la cabecera.'); },
        error: () => { this.ocupado.set(null); this.error.set('No se pudo retirar el artista de la cabecera.'); }
      });
      return;
    }
    if (!a.fotoUrl) { this.ocupado.set(null); this.error.set('El artista necesita una fotografía.'); return; }
    const item: Protagonista = {
      tipo:'ARTISTA', titulo:a.nombre,
      descripcion:[a.disciplina,a.provincia].filter(Boolean).join(' · '),
      imagenUrl:a.fotoUrl, destino:'/revista/artistas'
    };
    this.protagonistasApi.guardar(item).subscribe({
      next: guardado => { this.actualizarProtagonista(guardado); this.ocupado.set(null); this.aviso.set(`${a.nombre} es ahora el único artista muy destacado.`); },
      error: () => { this.ocupado.set(null); this.error.set('No se pudo actualizar el artista de la cabecera.'); }
    });
  }

  private buscarArtistas() {
    return this.api.listar({ estado: 'PUBLICADOS', q: this.texto, orden: 'nombre', size: 100 }).pipe(
      switchMap(p => of(p.content)),
      catchError(() => of([] as ArtistaAdmin[]))
    );
  }
}
