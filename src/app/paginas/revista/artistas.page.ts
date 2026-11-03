import { Component, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { REVISTA, SECCIONES } from '../../navegacion';
import { DISCIPLINAS, PROVINCIAS } from '../../catalogos';
import { Artista, ArtistasService } from '../../artistas.service';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

const POR_PAGINA = 12;

@Component({
  selector: 'csf-pagina-artistas',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent, RouterLink],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <form class="pag-filtros" role="search" aria-label="Filtrar artistas" (submit)="buscarNombre($event)">
        <label><span>Nombre artístico</span><input type="search" name="q" maxlength="120" [value]="q()" placeholder="Busca un artista" autocomplete="off"></label>
        <button type="submit">Buscar</button>
        <label>
          <span>Provincia</span>
          <select (change)="filtrar('provincia', $any($event.target).value)">
            <option value="">Todas</option>
            @for (p of provincias; track p) { <option [value]="p" [selected]="provincia() === p">{{ p }}</option> }
          </select>
        </label>
        <label>
          <span>Localidad</span>
          <input type="search" maxlength="120" [value]="localidad()" placeholder="Ej.: Montilla" (change)="filtrar('localidad', $any($event.target).value)">
        </label>
        <label>
          <span>Disciplina</span>
          <select (change)="filtrar('disciplina', $any($event.target).value)">
            <option value="">Todas</option>
            @for (d of disciplinas; track d) { <option [value]="d" [selected]="disciplina() === d">{{ d }}</option> }
          </select>
        </label>
      </form>

      @if (estado() === 'cargando') {
        <p class="pag-nota" role="status">Cargando artistas…</p>
      } @else if (estado() === 'error') {
        <p class="pag-nota pag-nota--error" role="alert">No podemos cargar los perfiles ahora. Inténtalo más tarde.</p>
      } @else if (artistas().length === 0) {
        @if (q() || provincia() || localidad() || disciplina()) {
          <csf-en-preparacion titulo="Sin resultados" texto="No hay artistas publicados con estos filtros. Prueba con otra provincia o disciplina." />
        } @else {
          <csf-en-preparacion titulo="Aún no hay artistas publicados" texto="Muy pronto encontrarás aquí los primeros perfiles de artistas." [enlaces]="[{ texto: 'Hazte miembro', ruta: '/registro' }]" />
        }
      } @else {
        <p class="pag-recuento" role="status">{{ total() }} {{ total() === 1 ? 'artista' : 'artistas' }}</p>
        <ul class="cards pag-artistas">
          @for (a of artistas(); track a.id) {
            <li class="artist">
              <a class="pag-artistas__enlace" [routerLink]="['/revista/artistas', a.slug]" [attr.aria-label]="'Ver perfil de ' + a.nombre">
              <div class="portrait">
                @if (a.fotoUrl) { <img [src]="a.fotoUrl" [alt]="'Fotografía de ' + a.nombre" loading="lazy"> }
                @else { <span>{{ a.disciplina }}</span> }
              </div>
              <h2 class="pag-artistas__nombre">{{ a.nombre }}</h2>
              <small>{{ a.disciplina }} · {{ a.localidad ? a.localidad + ', ' : '' }}{{ a.provincia }}</small>
              <span class="pag-artistas__ver">Conocer al artista ↗</span>
              </a>
            </li>
          }
        </ul>
        @if (paginas() > 1) {
          <nav class="pag-paginas" aria-label="Páginas">
            <button type="button" [disabled]="pagina() === 0" (click)="irA(pagina() - 1)">Anterior</button>
            <span>Página {{ pagina() + 1 }} de {{ paginas() }}</span>
            <button type="button" [disabled]="pagina() + 1 >= paginas()" (click)="irA(pagina() + 1)">Siguiente</button>
          </nav>
        }
      }
    </csf-pagina-seccion>
  `
})
export class ArtistasPage {
  private readonly api = inject(ArtistasService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly seccion = SECCIONES.artistas;
  readonly grupo = REVISTA;
  readonly provincias = PROVINCIAS;
  readonly disciplinas = DISCIPLINAS;
  readonly provincia = signal('');
  readonly localidad = signal('');
  readonly q = signal('');
  readonly disciplina = signal('');
  readonly pagina = signal(0);
  readonly artistas = signal<Artista[]>([]);
  readonly total = signal(0);
  readonly paginas = signal(0);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  private navegador = false;

  constructor() {
    // Como en la portada, la API solo se consulta en el navegador (no durante SSR/prerender).
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(q => {
      this.q.set((q.get('q') ?? '').slice(0,120));
      this.localidad.set((q.get('localidad') ?? '').slice(0,120));
      this.provincia.set(PROVINCIAS.includes(q.get('provincia') ?? '') ? q.get('provincia')! : '');
      this.disciplina.set(DISCIPLINAS.includes(q.get('disciplina') ?? '') ? q.get('disciplina')! : '');
      const p = Number(q.get('pagina') ?? '1');
      this.pagina.set(Number.isInteger(p) && p > 0 ? p - 1 : 0);
      if (this.navegador) this.cargar();
    });
    afterNextRender(() => { this.navegador = true; this.cargar(); });
  }

  buscarNombre(event: Event): void {
    event.preventDefault();
    const campo = (event.target as HTMLFormElement).elements.namedItem('q') as HTMLInputElement | null;
    this.router.navigate([], { relativeTo: this.route, queryParamsHandling: 'merge', queryParams: { q: campo?.value.trim() || null, pagina: null } });
  }

  filtrar(campo: 'provincia' | 'disciplina' | 'localidad', valor: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParamsHandling: 'merge', queryParams: { [campo]: valor || null, pagina: null } });
  }

  irA(pagina: number): void {
    this.router.navigate([], { relativeTo: this.route, queryParamsHandling: 'merge', queryParams: { pagina: pagina > 0 ? pagina + 1 : null } });
  }

  private cargar(): void {
    this.estado.set('cargando');
    this.api.buscar({ q: this.q(), localidad: this.localidad(), provincia: this.provincia(), disciplina: this.disciplina(), page: this.pagina(), size: POR_PAGINA }).subscribe({
      next: p => {
        this.artistas.set(p.content);
        this.total.set(p.totalElements);
        this.paginas.set(p.totalPages ?? 1);
        this.estado.set('listo');
      },
      error: () => this.estado.set('error')
    });
  }
}
