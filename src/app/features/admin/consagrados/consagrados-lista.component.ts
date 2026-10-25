import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Consagrado, ConsagradosApiService } from './consagrados-api.service';
import { mensajeDe } from '../core/errores';

@Component({
  standalone: true,
  selector: 'adm-consagrados-lista',
  imports: [RouterLink, ReactiveFormsModule],
  styleUrl: './consagrados.css',
  template: `
    <header class="adm-cabecera">
      <div><h1 class="adm-titulo">Artistas consagrados</h1>
        <p class="adm-subtitulo">Fichas de las figuras del flamenco documentadas en libros y otras fuentes.</p></div>
      <a routerLink="/admin/consagrados/nuevo" class="adm-btn adm-btn--oro">Añadir artista consagrado</a>
    </header>
    <form class="adm-filtros" role="search" (submit)="$event.preventDefault(); buscar()">
      <label class="adm-filtros__buscar adm-campo"><span>Buscar por título o nombre</span>
        <input type="search" [formControl]="busqueda" maxlength="100" placeholder="Buscar artista…"></label>
      <button class="adm-btn" type="submit">Buscar</button>
    </form>
    @if (error()) {
      <p class="adm-alerta" role="alert">{{ error() }} <button class="adm-enlace" (click)="cargar()">Reintentar</button></p>
    } @else if (cargando()) {
      <p role="status">Cargando fichas…</p>
    } @else if (!fichas().length) {
      <div class="adm-vacio">
        @if (consulta()) { <p>No hay fichas que coincidan con esta búsqueda.</p> }
        @else { <p>Todavía no hay artistas consagrados. Añade la primera ficha con imagen, título y descripción.</p>
          <a routerLink="/admin/consagrados/nuevo" class="adm-btn adm-btn--oro">Crear la primera ficha</a> }
      </div>
    } @else {
      <p class="adm-ayuda" role="status">{{ total() }} {{ total() === 1 ? 'ficha' : 'fichas' }}</p>
      <div class="consagrados-grid">
        @for (ficha of fichas(); track ficha.id) {
          <article><a [routerLink]="['/admin/consagrados', ficha.id]" class="consagrado-tarjeta" [attr.aria-label]="'Editar ' + ficha.titulo">
            <img [src]="ficha.fotoUrl" alt="" loading="lazy" width="400" height="300">
            <div class="consagrado-tarjeta__texto"><h2>{{ ficha.titulo }}</h2><p>{{ ficha.descripcion }}</p>
              @if (ficha.fuente) { <small>{{ ficha.fuente }}</small> }
              <span class="adm-enlace">Editar ficha ↗</span></div>
          </a></article>
        }
      </div>
      @if (paginas() > 1) {
        <nav class="adm-paginas" aria-label="Páginas de artistas consagrados">
          <button class="adm-btn" [disabled]="pagina() === 0" (click)="ir(pagina() - 1)">Anterior</button>
          <span>Página {{ pagina() + 1 }} de {{ paginas() }}</span>
          <button class="adm-btn" [disabled]="pagina() + 1 >= paginas()" (click)="ir(pagina() + 1)">Siguiente</button>
        </nav>
      }
    }
  `
})
export class ConsagradosListaComponent implements OnInit, OnDestroy {
  private readonly api = inject(ConsagradosApiService);
  private peticion?: Subscription;
  readonly busqueda = new FormControl('', { nonNullable: true });
  readonly consulta = signal('');
  readonly fichas = signal<Consagrado[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly pagina = signal(0);
  readonly total = signal(0);
  readonly paginas = signal(0);

  ngOnInit() { this.cargar(); }
  ngOnDestroy() { this.peticion?.unsubscribe(); }
  buscar() { this.consulta.set(this.busqueda.value.trim()); this.ir(0); }
  ir(pagina: number) { this.pagina.set(pagina); this.cargar(); }
  cargar() {
    this.peticion?.unsubscribe();
    this.cargando.set(true); this.error.set(null);
    this.peticion = this.api.listar(this.consulta(), this.pagina()).subscribe({
      next: pagina => {
        this.fichas.set(pagina.content); this.total.set(pagina.totalElements);
        this.paginas.set(pagina.totalPages); this.cargando.set(false);
      },
      error: error => { this.error.set(mensajeDe(error, 'No se han podido cargar las fichas.')); this.cargando.set(false); }
    });
  }
}
