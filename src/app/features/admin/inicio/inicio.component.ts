import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../core/admin-api.service';
import { AuthService } from '../core/auth.service';
import { mensajeDe } from '../core/errores';
import { ArtistaAdmin, EstadoFiltro, Resumen } from '../core/modelos';
import { ListaEstadoService, FILTRO_INICIAL } from '../artistas/lista-estado.service';
import { EstadoArtistaComponent } from '../ui/estado-artista.component';
import { RetratoComponent } from '../ui/retrato.component';

@Component({
  selector: 'adm-inicio',
  standalone: true,
  imports: [RouterLink, DatePipe, EstadoArtistaComponent, RetratoComponent],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Hola, {{ auth.sesion()?.nombre }}</h1>
        <p class="adm-subtitulo">Así está ahora el catálogo de artistas.</p>
      </div>
      <a routerLink="/admin/artistas/nuevo" class="adm-btn adm-btn--oro">Añadir artista</a>
    </header>

    @if (error()) {
      <p class="adm-alerta" role="alert">{{ error() }} <button type="button" class="adm-enlace" (click)="cargar()">Reintentar</button></p>
    }

    @if (resumen(); as r) {
      <section class="adm-recuento" aria-label="Recuento de artistas">
        <button type="button" (click)="ir('PUBLICADOS')"><strong>{{ r.publicados }}</strong><span>publicados en la web</span></button>
        <button type="button" (click)="ir('BORRADORES')"><strong>{{ r.borradores }}</strong><span>borradores sin publicar</span></button>
        <a routerLink="/admin/destacados"><strong>{{ r.destacados }}<small> de {{ r.maxDestacados }}</small></strong><span>destacados en portada</span></a>
        <button type="button" (click)="ir('ARCHIVADOS')"><strong>{{ r.archivados }}</strong><span>archivados</span></button>
      </section>
    } @else if (!error()) {
      <div class="adm-recuento adm-recuento--cargando" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    }

    <section class="adm-bloque">
      <div class="adm-bloque__cabecera">
        <h2 class="adm-bloque__titulo">Últimos cambios</h2>
        <a routerLink="/admin/artistas" class="adm-enlace">Ver todos los artistas</a>
      </div>
      @if (recientes().length) {
        <ul class="adm-recientes">
          @for (a of recientes(); track a.id) {
            <li>
              <a [routerLink]="['/admin/artistas', a.id]">
                <adm-retrato [url]="a.fotoUrl" [nombre]="a.nombre" />
                <span class="adm-recientes__nombre">{{ a.nombre }}<small>{{ a.disciplina }}, {{ a.provincia }}</small></span>
                <adm-estado-artista [artista]="a" />
                <time [attr.datetime]="a.actualizadoEn">{{ a.actualizadoEn | date: 'd MMM, HH:mm' }}</time>
              </a>
            </li>
          }
        </ul>
      } @else if (cargado()) {
        <div class="adm-vacio">
          <p>Todavía no hay artistas. Empieza por crear la primera ficha: quedará como borrador hasta que la publiques.</p>
          <a routerLink="/admin/artistas/nuevo" class="adm-btn adm-btn--oro">Añadir artista</a>
        </div>
      }
    </section>
  `
})
export class InicioComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AdminApiService);
  private readonly lista = inject(ListaEstadoService);
  private readonly router = inject(Router);

  readonly resumen = signal<Resumen | null>(null);
  readonly recientes = signal<ArtistaAdmin[]>([]);
  readonly cargado = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.error.set(null);
    forkJoin({
      resumen: this.api.resumen(),
      recientes: this.api.listar({ estado: 'TODOS', orden: 'actualizado', size: 6 })
    }).subscribe({
      next: ({ resumen, recientes }) => {
        this.resumen.set(resumen);
        this.recientes.set(recientes.content);
        this.cargado.set(true);
      },
      error: e => this.error.set(mensajeDe(e, 'No se ha podido cargar el resumen.'))
    });
  }

  ir(estado: EstadoFiltro): void {
    this.lista.filtro.set({ ...FILTRO_INICIAL, estado });
    this.router.navigate(['/admin/artistas']);
  }
}
