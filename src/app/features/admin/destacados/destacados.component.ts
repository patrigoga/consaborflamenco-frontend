import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';
import { AdminApiService } from '../core/admin-api.service';
import { AvisosService } from '../core/avisos.service';
import { mensajeDe } from '../core/errores';
import { ArtistaAdmin } from '../core/modelos';
import { RetratoComponent } from '../ui/retrato.component';

/** Los destacados se presentan como el cartel de un festival: tantos marcos como plazas permitidas. */
@Component({
  selector: 'adm-destacados',
  standalone: true,
  imports: [RouterLink, RetratoComponent],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Destacados en portada</h1>
        <p class="adm-subtitulo">{{ destacados().length }} de {{ max() }} plazas ocupadas. Solo pueden destacarse artistas publicados.</p>
      </div>
    </header>

    @if (error()) { <p class="adm-alerta" role="alert">{{ error() }}</p> }

    <section class="adm-cartel" aria-label="Cartel de destacados">
      <p class="adm-cartel__lema">ConSaborFlamenco presenta</p>
      <ul class="adm-cartel__plazas">
        @for (a of destacados(); track a.id) {
          <li class="adm-cartel__plaza">
            <adm-retrato [url]="a.fotoUrl" [nombre]="a.nombre" [grande]="true" />
            <a [routerLink]="['/admin/artistas', a.id]" class="adm-cartel__nombre">{{ a.nombre }}</a>
            <span class="adm-cartel__detalle">{{ a.disciplina }}, {{ a.provincia }}</span>
            <button type="button" class="adm-enlace" [disabled]="ocupado() === a.id" (click)="quitar(a)">Quitar del cartel</button>
          </li>
        }
        @for (h of huecos(); track $index) {
          <li class="adm-cartel__plaza adm-cartel__plaza--libre">
            <span class="adm-cartel__libre">Plaza libre</span>
          </li>
        }
      </ul>
    </section>

    <section class="adm-bloque">
      <div class="adm-bloque__cabecera">
        <h2 class="adm-bloque__titulo">Añadir al cartel</h2>
      </div>
      @if (huecos().length === 0) {
        <p class="adm-nota">El cartel está completo. Quita un artista para dejar sitio a otro.</p>
      } @else {
        <label class="adm-filtros__buscar adm-filtros__buscar--ancho">
          <span class="adm-oculto">Buscar artistas publicados</span>
          <input type="search" placeholder="Buscar entre los artistas publicados…" (input)="busqueda.next($any($event.target).value)" maxlength="100">
        </label>
        @if (candidatos().length) {
          <ul class="adm-candidatos">
            @for (a of candidatos(); track a.id) {
              <li>
                <adm-retrato [url]="a.fotoUrl" [nombre]="a.nombre" />
                <span class="adm-candidatos__nombre">{{ a.nombre }}<small>{{ a.disciplina }}, {{ a.provincia }}</small></span>
                <button type="button" class="adm-btn adm-btn--peq" [disabled]="ocupado() === a.id" (click)="destacar(a)">Destacar</button>
              </li>
            }
          </ul>
        } @else if (cargado()) {
          <p class="adm-nota">No hay artistas publicados sin destacar que coincidan. Publica una ficha desde <a routerLink="/admin/artistas" class="adm-enlace">Artistas</a>.</p>
        }
      }
    </section>
  `
})
export class DestacadosComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly avisos = inject(AvisosService);

  readonly destacados = signal<ArtistaAdmin[]>([]);
  readonly candidatosTodos = signal<ArtistaAdmin[]>([]);
  readonly max = signal(6);
  readonly ocupado = signal<number | null>(null);
  readonly cargado = signal(false);
  readonly error = signal<string | null>(null);
  readonly huecos = computed(() => Array.from({ length: Math.max(0, this.max() - this.destacados().length) }));
  readonly candidatos = computed(() => this.candidatosTodos().filter(a => !a.destacado).slice(0, 8));
  readonly busqueda = new Subject<string>();
  private texto = '';

  constructor() {
    this.busqueda.pipe(
      debounceTime(250),
      switchMap(q => { this.texto = q.trim(); return this.buscarCandidatos(); }),
      takeUntilDestroyed()
    ).subscribe(l => this.candidatosTodos.set(l));
  }

  ngOnInit(): void {
    this.api.catalogos().subscribe({ next: c => this.max.set(c.maxDestacados), error: () => {} });
    this.recargar();
  }

  recargar(): void {
    this.api.destacados().subscribe({
      next: l => this.destacados.set(l),
      error: e => this.error.set(mensajeDe(e, 'No se han podido cargar los destacados.'))
    });
    this.buscarCandidatos().subscribe(l => { this.candidatosTodos.set(l); this.cargado.set(true); });
  }

  destacar(a: ArtistaAdmin): void { this.cambiar(a, true); }
  quitar(a: ArtistaAdmin): void { this.cambiar(a, false); }

  private cambiar(a: ArtistaAdmin, destacar: boolean): void {
    this.ocupado.set(a.id);
    this.api.accion(a.id, destacar ? 'destacar' : 'quitar-destacado').subscribe({
      next: () => {
        this.ocupado.set(null);
        this.avisos.ok(destacar ? `${a.nombre} entra en el cartel.` : `${a.nombre} sale del cartel.`);
        this.recargar();
      },
      error: e => { this.ocupado.set(null); this.avisos.error(mensajeDe(e)); }
    });
  }

  private buscarCandidatos() {
    return this.api.listar({ estado: 'PUBLICADOS', q: this.texto, orden: 'nombre', size: 30 }).pipe(
      switchMap(p => of(p.content)),
      catchError(() => of([] as ArtistaAdmin[]))
    );
  }
}
