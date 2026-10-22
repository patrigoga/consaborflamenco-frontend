import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, tap, catchError, of } from 'rxjs';
import { AccionEditorial, AdminApiService } from '../core/admin-api.service';
import { AvisosService } from '../core/avisos.service';
import { ConfirmacionService } from '../core/confirmacion.service';
import { mensajeDe } from '../core/errores';
import { ArtistaAdmin, Catalogos, EstadoFiltro, FiltroArtistas, Orden, Pagina } from '../core/modelos';
import { EstadoArtistaComponent } from '../ui/estado-artista.component';
import { RetratoComponent } from '../ui/retrato.component';
import { FILTRO_INICIAL, ListaEstadoService } from './lista-estado.service';

const PESTANAS: { estado: EstadoFiltro; texto: string }[] = [
  { estado: 'ACTIVOS', texto: 'Todos' },
  { estado: 'PUBLICADOS', texto: 'Publicados' },
  { estado: 'BORRADORES', texto: 'Borradores' },
  { estado: 'DESTACADOS', texto: 'Destacados' },
  { estado: 'ARCHIVADOS', texto: 'Archivados' }
];

export const MENSAJES_ACCION: Record<AccionEditorial, string> = {
  'publicar': 'publicado',
  'despublicar': 'retirado de la web',
  'destacar': 'destacado en portada',
  'quitar-destacado': 'ya no está destacado',
  'archivar': 'archivado',
  'restaurar': 'restaurado como borrador'
};

@Component({
  selector: 'adm-artistas-lista',
  standalone: true,
  imports: [RouterLink, EstadoArtistaComponent, RetratoComponent],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Artistas</h1>
        <p class="adm-subtitulo">
          @if (pagina(); as p) { {{ p.totalElements }} {{ p.totalElements === 1 ? 'ficha' : 'fichas' }} con este filtro }
          @else { Cargando el catálogo… }
        </p>
      </div>
      <a routerLink="/admin/artistas/nuevo" class="adm-btn adm-btn--oro">Añadir artista</a>
    </header>

    <div class="adm-pestanas" role="tablist" aria-label="Estado">
      @for (p of pestanas; track p.estado) {
        <button type="button" role="tab" [attr.aria-selected]="filtro().estado === p.estado"
                (click)="cambiar({ estado: p.estado })">{{ p.texto }}</button>
      }
    </div>

    <div class="adm-filtros">
      <label class="adm-filtros__buscar">
        <span class="adm-oculto">Buscar por nombre</span>
        <input type="search" placeholder="Buscar por nombre…" [value]="filtro().q" (input)="buscar($any($event.target).value)" maxlength="100">
      </label>
      <label>
        <span class="adm-oculto">Disciplina</span>
        <select [value]="filtro().disciplina" (change)="cambiar({ disciplina: $any($event.target).value })">
          <option value="">Todas las disciplinas</option>
          @for (d of catalogos()?.disciplinas ?? []; track d) { <option [value]="d" [selected]="filtro().disciplina === d">{{ d }}</option> }
        </select>
      </label>
      <label>
        <span class="adm-oculto">Provincia</span>
        <select (change)="cambiar({ provincia: $any($event.target).value })">
          <option value="">Todas las provincias</option>
          @for (p of catalogos()?.provincias ?? []; track p) { <option [value]="p" [selected]="filtro().provincia === p">{{ p }}</option> }
        </select>
      </label>
      <label>
        <span class="adm-oculto">Ordenar</span>
        <select (change)="cambiar({ orden: $any($event.target).value })">
          <option value="nombre" [selected]="filtro().orden === 'nombre'">Por nombre</option>
          <option value="actualizado" [selected]="filtro().orden === 'actualizado'">Editados recientemente</option>
          <option value="creado" [selected]="filtro().orden === 'creado'">Añadidos recientemente</option>
        </select>
      </label>
      @if (hayFiltros()) {
        <button type="button" class="adm-enlace" (click)="limpiar()">Quitar filtros</button>
      }
    </div>

    @if (error()) {
      <p class="adm-alerta" role="alert">{{ error() }} <button type="button" class="adm-enlace" (click)="recargar()">Reintentar</button></p>
    }

    @if (pagina(); as p) {
      @if (p.content.length) {
        <div class="adm-tabla" role="table" aria-label="Artistas" [class.is-cargando]="cargando()">
          <div class="adm-tabla__fila adm-tabla__cabecera" role="row">
            <span role="columnheader">Artista</span>
            <span role="columnheader" class="adm-tabla__dato">Disciplina</span>
            <span role="columnheader" class="adm-tabla__dato">Provincia</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader"><span class="adm-oculto">Acciones</span></span>
          </div>
          @for (a of p.content; track a.id) {
            <div class="adm-tabla__fila" role="row">
              <span role="cell" class="adm-tabla__artista">
                <adm-retrato [url]="a.fotoUrl" [nombre]="a.nombre" />
                <a [routerLink]="['/admin/artistas', a.id]" class="adm-tabla__nombre">{{ a.nombre }}</a>
              </span>
              <span role="cell" class="adm-tabla__dato" data-etiqueta="Disciplina">{{ a.disciplina }}</span>
              <span role="cell" class="adm-tabla__dato" data-etiqueta="Provincia">{{ a.provincia }}</span>
              <span role="cell" class="adm-tabla__estado"><adm-estado-artista [artista]="a" /></span>
              <span role="cell" class="adm-tabla__acciones">
                @if (a.archivado) {
                  <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" [disabled]="ocupado() === a.id" (click)="ejecutar(a, 'restaurar')">Restaurar</button>
                } @else {
                  @if (a.publicado) {
                    <button type="button" class="adm-estrella" [class.is-activa]="a.destacado" [disabled]="ocupado() === a.id || (!a.destacado && destacadosLlenos())"
                            [attr.aria-pressed]="a.destacado" [attr.title]="!a.destacado && destacadosLlenos() ? 'Ya hay ' + (catalogos()?.maxDestacados ?? 6) + ' destacados' : null"
                            (click)="ejecutar(a, a.destacado ? 'quitar-destacado' : 'destacar')">
                      <span class="adm-oculto">{{ a.destacado ? 'Quitar de destacados' : 'Destacar en portada' }}</span>
                    </button>
                    <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" [disabled]="ocupado() === a.id" (click)="ejecutar(a, 'despublicar')">Retirar</button>
                  } @else {
                    <button type="button" class="adm-btn adm-btn--peq" [disabled]="ocupado() === a.id" (click)="ejecutar(a, 'publicar')">Publicar</button>
                  }
                  <a [routerLink]="['/admin/artistas', a.id]" class="adm-btn adm-btn--quieto adm-btn--peq">Editar</a>
                }
              </span>
            </div>
          }
        </div>

        @if (p.totalPages > 1) {
          <nav class="adm-paginas" aria-label="Páginas">
            <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" [disabled]="p.page === 0" (click)="irPagina(p.page - 1)">Anterior</button>
            <span>Página {{ p.page + 1 }} de {{ p.totalPages }}</span>
            <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" [disabled]="p.page + 1 >= p.totalPages" (click)="irPagina(p.page + 1)">Siguiente</button>
          </nav>
        }
      } @else {
        <div class="adm-vacio">
          @if (hayFiltros()) {
            <p>Ningún artista coincide con estos filtros.</p>
            <button type="button" class="adm-btn adm-btn--quieto" (click)="limpiar()">Quitar filtros</button>
          } @else if (filtro().estado === 'ARCHIVADOS') {
            <p>No hay artistas archivados. Al archivar una ficha deja de verse en la web y se puede restaurar desde aquí.</p>
          } @else {
            <p>Aún no hay artistas en esta vista.</p>
            <a routerLink="/admin/artistas/nuevo" class="adm-btn adm-btn--oro">Añadir artista</a>
          }
        </div>
      }
    } @else if (!error()) {
      <div class="adm-tabla adm-tabla--esqueleto" aria-hidden="true">@for (i of [1,2,3,4,5]; track i) { <div class="adm-tabla__fila"></div> }</div>
    }
  `
})
export class ArtistasListaComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly estado = inject(ListaEstadoService);

  readonly pestanas = PESTANAS;
  readonly filtro = this.estado.filtro;
  readonly pagina = signal<Pagina<ArtistaAdmin> | null>(null);
  readonly catalogos = signal<Catalogos | null>(null);
  readonly totalDestacados = signal(0);
  readonly cargando = signal(false);
  readonly ocupado = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly hayFiltros = computed(() => {
    const f = this.filtro();
    return !!(f.q || f.disciplina || f.provincia);
  });
  readonly destacadosLlenos = computed(() => this.totalDestacados() >= (this.catalogos()?.maxDestacados ?? 6));

  private readonly peticiones = new Subject<FiltroArtistas>();
  private readonly busqueda = new Subject<string>();

  constructor() {
    this.peticiones.pipe(
      tap(() => { this.cargando.set(true); this.error.set(null); }),
      switchMap(f => this.api.listar(f).pipe(catchError(e => { this.error.set(mensajeDe(e, 'No se ha podido cargar el listado.')); return of(null); }))),
      takeUntilDestroyed()
    ).subscribe(p => {
      this.cargando.set(false);
      if (p) this.pagina.set(p);
    });
    this.busqueda.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(q => this.cambiar({ q: q.trim() }));
  }

  ngOnInit(): void {
    this.api.catalogos().subscribe({ next: c => this.catalogos.set(c), error: () => {} });
    this.recargar();
  }

  recargar(): void {
    this.peticiones.next(this.filtro());
    this.api.resumen().subscribe({ next: r => this.totalDestacados.set(r.destacados), error: () => {} });
  }

  buscar(q: string): void { this.busqueda.next(q); }

  cambiar(cambio: Partial<FiltroArtistas>): void {
    this.filtro.update(f => ({ ...f, ...cambio, page: 0 }));
    this.peticiones.next(this.filtro());
  }

  limpiar(): void {
    this.filtro.update(f => ({ ...FILTRO_INICIAL, estado: f.estado, orden: f.orden as Orden }));
    this.peticiones.next(this.filtro());
  }

  irPagina(page: number): void {
    this.filtro.update(f => ({ ...f, page }));
    this.peticiones.next(this.filtro());
  }

  async ejecutar(a: ArtistaAdmin, accion: AccionEditorial): Promise<void> {
    if (accion === 'despublicar') {
      const ok = await this.confirmacion.pedir({
        titulo: `Retirar a ${a.nombre} de la web`,
        mensaje: 'La ficha dejará de verse en la web pública y saldrá de destacados. Podrás volver a publicarla cuando quieras.',
        aceptar: 'Retirar de la web'
      });
      if (!ok) return;
    }
    this.ocupado.set(a.id);
    this.api.accion(a.id, accion).subscribe({
      next: actualizado => {
        this.ocupado.set(null);
        this.avisos.ok(`${actualizado.nombre}: ${MENSAJES_ACCION[accion]}.`);
        this.recargar();
      },
      error: e => {
        this.ocupado.set(null);
        this.avisos.error(mensajeDe(e));
      }
    });
  }
}
