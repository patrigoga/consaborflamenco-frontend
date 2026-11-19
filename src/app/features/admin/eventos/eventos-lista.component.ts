import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvisosService } from '../core/avisos.service';
import { ConfirmacionService } from '../core/confirmacion.service';
import { mensajeDe } from '../core/errores';
import { Pagina } from '../core/modelos';
import { AccionEvento, EventoAdmin, EventosApiService, FiltroEventos } from './eventos-api.service';

@Component({
  selector: 'adm-eventos-lista',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Eventos</h1>
        <p class="adm-subtitulo">Crea y revisa los eventos antes de mostrarlos públicamente.</p>
      </div>
      <a routerLink="/admin/eventos/nuevo" class="adm-btn adm-btn--oro">Nuevo evento</a>
    </header>

    <div class="adm-filtros">
      <label class="adm-filtros__buscar">
        <span class="adm-oculto">Buscar eventos</span>
        <input type="search" maxlength="100" placeholder="Buscar evento…" [value]="buscar()"
               (input)="buscar.set($any($event.target).value)" (keyup.enter)="cargar(0)">
      </label>
      <label>
        <span class="adm-oculto">Estado de los eventos</span>
        <select [value]="estado()" (change)="cambiarEstado($any($event.target).value)">
          <option value="ACTIVOS">Activos</option>
          <option value="PENDIENTES">Pendientes</option>
          <option value="PUBLICADOS">Publicados</option>
          <option value="BORRADORES">No publicados</option>
          <option value="ARCHIVADOS">Archivados</option>
          <option value="TODOS">Todos</option>
        </select>
      </label>
      <button type="button" class="adm-btn adm-btn--quieto" (click)="cargar(0)">Buscar</button>
    </div>

    @if (error()) {
      <p role="alert" class="adm-alerta">{{ error() }}</p>
    }
    @if (pagina(); as p) {
      <p class="adm-subtitulo">{{ p.totalElements }} eventos encontrados</p>
      @if (p.content.length) {
        <div class="adm-tabla" role="table" aria-label="Eventos">
          <div class="adm-tabla__fila adm-tabla__cabecera" role="row">
            <span role="columnheader">Evento</span>
            <span role="columnheader">Fecha</span>
            <span role="columnheader">Lugar</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader">Acciones</span>
          </div>
          @for (e of p.content; track e.id) {
            <div class="adm-tabla__fila" role="row">
              <span role="cell"><a class="adm-tabla__nombre" [routerLink]="['/admin/eventos',e.id]">{{ e.titulo }}</a></span>
              <span role="cell" class="adm-tabla__dato">{{ e.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</span>
              <span role="cell" class="adm-tabla__dato">{{ e.localidad || e.lugar || 'Por concretar' }}</span>
              <span role="cell">
                @if (e.archivado) { <span class="adm-estado" data-estado="archivado">Archivado</span> }
                @else if (e.publicado) { <span class="adm-estado" data-estado="publicado">Publicado</span> }
                @else { <span class="adm-estado" data-estado="borrador">{{ e.estadoRevision }}</span> }
              </span>
              <span role="cell" class="adm-tabla__acciones">
                <a class="adm-btn adm-btn--quieto adm-btn--peq" [routerLink]="['/admin/eventos',e.id]">Editar</a>
                @if (e.archivado) {
                  <button class="adm-btn adm-btn--peq" type="button" [disabled]="ocupado() === e.id" (click)="accion(e,'restaurar')">Restaurar</button>
                } @else if (e.publicado) {
                  <button class="adm-btn adm-btn--quieto adm-btn--peq" type="button" [disabled]="ocupado() === e.id" (click)="accion(e,'despublicar')">Retirar</button>
                } @else if (e.estadoRevision === 'APROBADO') {
                  <button class="adm-btn adm-btn--peq" type="button" [disabled]="ocupado() === e.id" (click)="accion(e,'publicar')">Publicar</button>
                } @else {
                  <button class="adm-btn adm-btn--peq" type="button" [disabled]="ocupado() === e.id" (click)="accion(e,'aprobar')">Aprobar</button>
                }
              </span>
            </div>
          }
        </div>
        @if (p.totalPages > 1) {
          <nav class="adm-paginas" aria-label="Páginas de eventos">
            <button class="adm-btn adm-btn--quieto" type="button" [disabled]="p.page === 0" (click)="cargar(p.page-1)">Anterior</button>
            <span>Página {{ p.page + 1 }} de {{ p.totalPages }}</span>
            <button class="adm-btn adm-btn--quieto" type="button" [disabled]="p.page+1 >= p.totalPages" (click)="cargar(p.page+1)">Siguiente</button>
          </nav>
        }
      } @else {
        <div class="adm-vacio">No hay eventos con este filtro.
          <a routerLink="/admin/eventos/nuevo" class="adm-btn adm-btn--oro">Crear evento</a>
        </div>
      }
    }
  `
})
export class EventosListaComponent implements OnInit {
  private readonly api = inject(EventosApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  readonly pagina = signal<Pagina<EventoAdmin> | null>(null);
  readonly buscar = signal('');
  readonly estado = signal<FiltroEventos>('ACTIVOS');
  readonly error = signal<string | null>(null);
  readonly ocupado = signal<number | null>(null);

  ngOnInit(): void { this.cargar(0); }
  cambiarEstado(value: FiltroEventos): void { this.estado.set(value); this.cargar(0); }
  cargar(page: number): void {
    this.error.set(null);
    this.api.listar(this.buscar(), this.estado(), page).subscribe({
      next: p => this.pagina.set(p),
      error: e => this.error.set(mensajeDe(e, 'No ha sido posible cargar los eventos.'))
    });
  }
  async accion(e: EventoAdmin, accion: AccionEvento): Promise<void> {
    if (accion === 'despublicar' || accion === 'archivar') {
      const ok = await this.confirmacion.pedir({
        titulo: accion === 'archivar' ? 'Archivar evento' : 'Retirar evento',
        mensaje: 'El evento dejará de estar visible en la agenda pública.',
        aceptar: 'Continuar'
      });
      if (!ok) return;
    }
    this.ocupado.set(e.id);
    this.api.accion(e.id, accion).subscribe({
      next: () => { this.ocupado.set(null); this.avisos.ok('Estado del evento actualizado.'); this.cargar(this.pagina()?.page ?? 0); },
      error: err => { this.ocupado.set(null); this.avisos.error(mensajeDe(err)); }
    });
  }
}
