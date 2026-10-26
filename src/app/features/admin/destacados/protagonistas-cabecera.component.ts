import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../core/admin-api.service';
import { ArtistaAdmin } from '../core/modelos';
import { Protagonista, ProtagonistasService, TIPOS_PROTAGONISTA, TipoProtagonista } from '../../home/protagonistas.service';

@Component({
  selector: 'adm-protagonistas-cabecera', standalone: true, imports: [FormsModule],
  template: `
    <section class="adm-bloque" aria-labelledby="cabecera-protagonistas">
      <h2 id="cabecera-protagonistas">Protagonistas de la cabecera</h2>
      <p>Selecciona un artista, un evento y un curso mediante su imagen y enlace a una ficha publicada. Solo tú, como administrador principal, puedes cambiar estos espacios.</p>
      @if (aviso()) { <p role="status">{{ aviso() }}</p> }
      <div style="padding:15px;background:#f8f3e9;color:#34240e;border-radius:8px">
        <label for="buscar-artista">Buscar artista publicado para la cabecera</label>
        <input id="buscar-artista" type="search" style="display:block;width:100%;padding:10px;margin:8px 0"
               placeholder="Escribe el nombre del artista" [(ngModel)]="busqueda" (ngModelChange)="buscarArtistas()" maxlength="100">
        @if (buscando()) { <p>Buscando artistas…</p> }
        @for (artista of candidatos(); track artista.id) {
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0">
            <span>{{ artista.nombre }} · {{ artista.disciplina }} · {{ artista.provincia }}</span>
            <button type="button" class="adm-btn" (click)="elegirArtista(artista)">Elegir</button>
          </div>
        }
        @if (busqueda.trim() && !buscando() && candidatos().length === 0) { <p>No hay artistas publicados que coincidan.</p> }
      </div>
      @for (tipo of tipos; track tipo) {
        <fieldset style="margin:18px 0;padding:18px;border:1px solid #d8c9b1;border-radius:8px">
          <legend><strong>{{ etiquetas[tipo] }}</strong></legend>
          <label style="display:block;margin:10px 0">Título
            <input style="display:block;width:100%;padding:10px" [name]="'titulo-'+tipo" [(ngModel)]="entradas[tipo].titulo" maxlength="120">
          </label>
          <label style="display:block;margin:10px 0">Descripción
            <input style="display:block;width:100%;padding:10px" [name]="'descripcion-'+tipo" [(ngModel)]="entradas[tipo].descripcion" maxlength="240">
          </label>
          <label style="display:block;margin:10px 0">URL HTTPS de la fotografía o cartel
            <input style="display:block;width:100%;padding:10px" [name]="'imagen-'+tipo" [(ngModel)]="entradas[tipo].imagenUrl" placeholder="https://..." maxlength="512">
          </label>
          <label style="display:block;margin:10px 0">Enlace interno a la ficha
            <input style="display:block;width:100%;padding:10px" [name]="'destino-'+tipo" [(ngModel)]="entradas[tipo].destino" placeholder="/eventos" maxlength="255">
          </label>
          <button type="button" class="adm-btn adm-btn--oro" [disabled]="guardando()" (click)="guardar(tipo)">Guardar {{ etiquetas[tipo].toLowerCase() }}</button>
          <button type="button" class="adm-btn" style="margin-left:10px" [disabled]="guardando()" (click)="eliminar(tipo)">Quitar</button>
        </fieldset>
      }
    </section>
  `
})
export class ProtagonistasCabeceraComponent {
  private readonly api = inject(ProtagonistasService);
  private readonly artistasApi = inject(AdminApiService);
  readonly candidatos = signal<ArtistaAdmin[]>([]);
  readonly buscando = signal(false);
  busqueda = '';
  private busquedaVersion = 0;

  buscarArtistas(): void {
    const nombre = this.busqueda.trim();
    const version = ++this.busquedaVersion;
    if (!nombre) { this.candidatos.set([]); this.buscando.set(false); return; }
    this.buscando.set(true);
    this.artistasApi.listar({ estado: 'PUBLICADOS', q: nombre, size: 12 }).subscribe({
      next: pagina => { if (version === this.busquedaVersion) {this.candidatos.set(pagina.content);this.buscando.set(false);} },
      error: () => { if (version === this.busquedaVersion) {this.candidatos.set([]);this.buscando.set(false);this.aviso.set('No se pudo buscar artistas.');} }
    });
  }

  elegirArtista(artista: ArtistaAdmin): void {
    if (!artista.fotoUrl) {this.aviso.set('Este artista necesita una fotografía para aparecer en la cabecera.');return;}
    this.entradas.ARTISTA = {
      tipo: 'ARTISTA', titulo: artista.nombre,
      descripcion: [artista.disciplina, artista.provincia].filter(Boolean).join(' · '),
      imagenUrl: artista.fotoUrl,
      destino: '/revista/artistas'
    };
    this.aviso.set('Artista seleccionado. Pulsa «Guardar artista principal» para publicarlo.');
  }
  readonly tipos = TIPOS_PROTAGONISTA;
  readonly etiquetas: Record<TipoProtagonista,string> = { ARTISTA: 'Artista principal', EVENTO: 'Evento principal', CURSO: 'Curso principal' };
  readonly aviso = signal('');
  readonly guardando = signal(false);
  readonly entradas: Record<TipoProtagonista, Protagonista> = {
    ARTISTA: {tipo:'ARTISTA',titulo:'',descripcion:'',imagenUrl:'',destino:''},
    EVENTO: {tipo:'EVENTO',titulo:'',descripcion:'',imagenUrl:'',destino:''},
    CURSO: {tipo:'CURSO',titulo:'',descripcion:'',imagenUrl:'',destino:''}
  };
  constructor() { this.api.listar().subscribe({next: lista => lista.forEach(item => {this.entradas[item.tipo]={...item};}),error:()=>this.aviso.set('No se pudieron cargar los protagonistas.')}); }
  guardar(tipo: TipoProtagonista) {
    this.guardando.set(true);
    this.api.guardar(this.entradas[tipo]).subscribe({
      next: () => {this.guardando.set(false);this.aviso.set(this.etiquetas[tipo] + ' actualizado.');},
      error: () => {this.guardando.set(false);this.aviso.set('No se pudo guardar. Revisa el título, la imagen HTTPS y el enlace interno.');}
    });
  }
  eliminar(tipo: TipoProtagonista) {
    this.guardando.set(true);
    this.api.eliminar(tipo).subscribe({
      next: () => {this.entradas[tipo]={tipo,titulo:'',descripcion:'',imagenUrl:'',destino:''};this.guardando.set(false);this.aviso.set(this.etiquetas[tipo]+' retirado.');},
      error: () => {this.guardando.set(false);this.aviso.set('No se pudo retirar el protagonista.');}
    });
  }
}
