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
                <img [src]="b.imagenUrl" [alt]="b.titulo">
              </a>
            } @else if(e.disponible && inv.contratacionHabilitada){
              <a routerLink="/promocion" [queryParams]="{municipio:municipioId,posicion:e.posicion}" [attr.aria-label]="'Contratar banner '+e.posicion+' en '+inv.nombre">
                <img [src]="inv.imagenUrl" alt="Espacio publicitario disponible"><span class="cta">Contratar este espacio</span>
              </a>
            } @else {
              <div class="reservado"><img [src]="inv.imagenUrl" alt="Espacio publicitario"><span class="cta">{{e.disponible?'Contratación no disponible':'Espacio reservado'}}</span></div>
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
    .espacios{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0 34px}
    article{aspect-ratio:3/1;border-radius:12px;overflow:hidden;background:#241b18;min-width:0;box-shadow:inset 0 0 0 1px #695037}
    a,.reservado{position:relative;display:block;width:100%;height:100%;color:#f7f1e8;text-decoration:none}
    a:hover,a:focus-visible{outline:2px solid #e3b674;outline-offset:-3px}
    img{display:block;width:100%;height:100%;object-fit:contain}
    .cta{position:absolute;bottom:8%;right:4%;max-width:92%;padding:6px 12px;border-radius:5px;background:#21170de8;color:#f5d58c;font-size:clamp(.75rem,1.2vw,1rem);font-weight:700;text-align:center}
    button{font:inherit;padding:12px}
    @media(max-width:740px){.espacios{grid-template-columns:1fr}}
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
