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
  `,
  styles: [`
    .adm-grid-artistas { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr)); gap:14px; margin-top:16px; }
    .adm-artista-opcion { display:flex; gap:12px; flex-wrap:wrap; align-items:center; padding:14px; border:1px solid #bca782; border-radius:9px; min-width:0; }
    .adm-artista-opcion__datos { flex:1 1 140px; min-width:0; display:flex; flex-direction:column; gap:5px; }
    .adm-artista-opcion__datos small { color:#76695a; }
    .adm-artista-opcion__estado { color:#95601b; font-size:.8rem; }
    .adm-artista-opcion__acciones { display:flex; gap:8px; flex-wrap:wrap; width:100%; }
    .adm-artista-opcion__acciones button { flex:1; }
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
      next: lista => this.protagonista.set(lista.find(p => p.tipo === 'ARTISTA') ?? null),
      error: () => this.error.set('No se pudo cargar el artista protagonista.')
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
        next: () => { this.protagonista.set(null); this.ocupado.set(null); this.aviso.set('Artista retirado de la cabecera.'); },
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
      next: guardado => { this.protagonista.set(guardado); this.ocupado.set(null); this.aviso.set(`${a.nombre} es ahora el único artista muy destacado.`); },
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
