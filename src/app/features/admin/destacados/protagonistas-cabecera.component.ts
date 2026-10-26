import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Protagonista, ProtagonistasService, TIPOS_PROTAGONISTA, TipoProtagonista } from '../../home/protagonistas.service';

@Component({
  selector: 'adm-protagonistas-cabecera', standalone: true, imports: [FormsModule],
  template: `
    <section class="adm-bloque" aria-labelledby="cabecera-protagonistas">
      <h2 id="cabecera-protagonistas">Protagonistas de la cabecera</h2>
      <p>Selecciona un artista, un evento y un curso mediante su imagen y enlace a una ficha publicada. Solo tú, como administrador principal, puedes cambiar estos espacios.</p>
      @if (aviso()) { <p role="status">{{ aviso() }}</p> }
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
