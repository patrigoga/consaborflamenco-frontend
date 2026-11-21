import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface Provincia { id: number; nombre: string; region_id: number; codigo_oficial: string; }
interface Municipio { id: number; nombre: string; provincia: string; region: string; codigo_oficial?: string; }

@Component({
 selector: 'adm-catalogo-municipios',
 standalone: true,
 imports: [FormsModule, RouterLink],
 template: `
 <section class="catalogo">
  <header><h1>Municipios</h1><p>Catálogo territorial oficial. Los códigos se guardan en MySQL y no se escriben a mano.</p></header>
  <form (ngSubmit)="buscar()" class="filtros">
   <label>Provincia
    <select name="provincia" [(ngModel)]="provinciaId" (ngModelChange)="buscar()">
     <option [ngValue]="0">Todas las provincias</option>
     @for (p of provincias(); track p.id) { <option [ngValue]="p.id">{{p.nombre}}</option> }
    </select>
   </label>
   <label>Buscar localidad o municipio
    <input type="search" name="q" [(ngModel)]="texto" maxlength="100" placeholder="Montilla, Elda, Utrera…">
   </label>
   <button type="submit">Buscar</button>
  </form>
  @if (error()) { <p role="alert" class="error">{{error()}}</p> }
  @if (cargando()) { <p role="status">Buscando municipios…</p> }
  <p class="ayuda">Se muestran hasta 100 coincidencias. Utiliza el buscador para localizar otros municipios.</p>
  <div class="resultados">
   @for (m of municipios(); track m.id) {
    <article><div><strong>{{m.nombre}}</strong><p>{{m.provincia}} · {{m.region}}</p></div>
     <a [routerLink]="['/municipios',m.id]" target="_blank" rel="noopener">Ver página municipal ↗</a>
    </article>
   }
  </div>
  @if (!cargando() && !municipios().length && !error()) { <p>No hay coincidencias.</p> }
  <p class="ayuda">La administración de los anuncios se realiza por separado en <a routerLink="/admin/publicidad-municipal">Publicidad municipal</a>.</p>
 </section>`,
 styles:[`
 .catalogo{max-width:1050px;margin:0 auto;padding:22px 28px 60px}
 header{margin-bottom:28px}h1{font-size:clamp(1.8rem,3vw,2.3rem)}header p,.ayuda{color:#736657}
 .filtros{display:grid;grid-template-columns:1fr 1.5fr auto;align-items:end;gap:14px;margin-bottom:20px}
 label{display:grid;gap:8px;font-weight:650}
 select,input{padding:12px;border:1px solid #b4a38e;border-radius:7px;font:inherit;min-width:0}
 button{padding:12px 18px;background:#d0a363;color:#1d140c;border:0;border-radius:7px;font:inherit;cursor:pointer}
 .resultados{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
 article{border:1px solid #d5c6b0;padding:18px;border-radius:10px;background:#fff}
 article p{color:#736657;margin:8px 0 18px;font-size:.88rem}article a{color:#7c521e}
 .error{color:#ae2929}.ayuda{font-size:.85rem;margin:18px 0}
 @media(max-width:700px){.filtros{grid-template-columns:1fr}}
 `]
})
export class CatalogoMunicipiosAdminComponent implements OnInit {
 private readonly http=inject(HttpClient);
 readonly provincias=signal<Provincia[]>([]);
 readonly municipios=signal<Municipio[]>([]);
 readonly cargando=signal(false);
 readonly error=signal('');
 provinciaId=0;
 texto='';
 ngOnInit():void {
  this.http.get<Provincia[]>('/api/v1/territorio/provincias').subscribe({
   next:items=>this.provincias.set(items),
   error:()=>this.error.set('No se han podido cargar las provincias.')
  });
  this.buscar();
 }
 buscar():void {
  this.cargando.set(true);this.error.set('');
  let params=new HttpParams().set('q',this.texto.trim());
  if(this.provinciaId)params=params.set('provinciaId',this.provinciaId);
  this.http.get<Municipio[]>('/api/v1/territorio/municipios',{params}).subscribe({
   next:items=>{this.municipios.set(items);this.cargando.set(false);},
   error:()=>{this.error.set('No se han podido consultar los municipios.');this.cargando.set(false);}
  });
 }
}
