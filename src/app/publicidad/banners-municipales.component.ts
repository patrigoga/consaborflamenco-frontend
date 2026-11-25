import { Component, Input, OnChanges, afterNextRender, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { BannerPromocion } from './banners-promocion.component';

export interface InventarioMunicipal {
  municipioId:number;nombre:string;imagenUrl:string;precioMensualCentimos:number;contratacionHabilitada:boolean;
  espacios:{posicion:number;disponible:boolean;banner:BannerPromocion|null}[];
}
@Component({
  selector:'csf-banners-municipales',standalone:true,imports:[RouterLink],
  template:`
    <section aria-label="Publicidad del municipio" class="espacios">
      @if(inventario();as inv){
        @for(e of inv.espacios;track e.posicion){
          <article>
            @if(e.banner;as b){
              <a [href]="b.destinoUrl" [attr.target]="b.destinoUrl.startsWith('https://')?'_blank':null" rel="sponsored noopener noreferrer">
                <img [src]="b.imagenUrl" [alt]="b.titulo"><span class="texto"><small>Publicidad</small><strong>{{b.titulo}}</strong><span>{{b.anunciante}}</span></span>
              </a>
            } @else if(e.disponible && inv.contratacionHabilitada){
              <a routerLink="/promocion" [queryParams]="{municipio:municipioId,posicion:e.posicion}" [attr.aria-label]="'Contratar banner '+e.posicion+' en '+inv.nombre">
                <img [src]="inv.imagenUrl" alt="Espacio publicitario disponible"><span class="texto"><small>Publicidad · Banner {{e.posicion}}</small><strong>Tu anuncio en {{inv.nombre}}</strong><span>Contratar este espacio</span></span>
              </a>
            } @else {
              <div class="reservado"><img [src]="inv.imagenUrl" alt="Espacio publicitario"><span class="texto"><small>Publicidad · Banner {{e.posicion}}</small><strong>{{e.disponible?'Contratación no disponible':'Espacio reservado'}}</strong></span></div>
            }
          </article>
        }
      } @else {
        <p role="status">{{error()?'No podemos consultar los espacios publicitarios.':'Cargando espacios publicitarios…'}}</p>
        @if(error()){<button type="button" (click)="cargar()">Reintentar</button>}
      }
    </section>
  `,
  styles:[`
    .espacios{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:0 0 34px}
    article{border:1px solid #766044;border-radius:10px;overflow:hidden;background:#241c20;min-width:0}
    a,.reservado{display:flex;min-height:145px;color:#f7f1e8;text-decoration:none}
    a:hover,a:focus-visible{outline:2px solid #e3b674;outline-offset:-2px}
    img{width:42%;object-fit:cover;min-width:0}.texto{display:flex;flex-direction:column;justify-content:center;gap:10px;padding:18px;overflow-wrap:anywhere}
    small{color:#e1b878;font-size:.875rem}strong{font-size:1.125rem}span span{font-size:1rem}
    button{font:inherit;padding:12px}
    @media(max-width:700px){.espacios{grid-template-columns:1fr}a,.reservado{min-height:130px}}
  `]
})
export class BannersMunicipalesComponent implements OnChanges {
  @Input({required:true}) municipioId=0;
  private readonly http=inject(HttpClient);
  readonly inventario=signal<InventarioMunicipal|null>(null);
  readonly error=signal(false);
  private listo=false;
  private revision=0;
  constructor(){afterNextRender(()=>{this.listo=true;this.cargar();});}
  ngOnChanges():void{if(this.listo)this.cargar();}
  cargar():void{
    const rev=++this.revision;this.inventario.set(null);this.error.set(false);
    if(!this.municipioId)return;
    this.http.get<InventarioMunicipal>('/api/v1/promocion/municipios/'+this.municipioId).subscribe({
      next:r=>{if(rev===this.revision)this.inventario.set(r);},error:()=>{if(rev===this.revision)this.error.set(true);}
    });
  }
}
