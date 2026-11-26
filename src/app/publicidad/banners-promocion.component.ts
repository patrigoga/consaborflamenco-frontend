import { Component, DestroyRef, Input, OnChanges, afterNextRender, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface BannerPromocion {
  ubicacion:string; posicion:number; titulo:string; anunciante:string;
  imagenUrl:string; destinoUrl:string; activo:boolean;
  precioBaseCentimos:number; descuentoAplicado:number; precioFinalCentimos:number;
}

/** Solo anuncios activos y vigentes. Se consulta tras renderizar para no romper SSR. */
@Component({
  selector:'csf-banners-promocion',standalone:true,
  template:`
    @if (banners().length) {
      <section class="banner-promocion" aria-label="Publicidad">
        @for (b of banners(); track b.posicion) {
          <article class="banner-promocion__item">
            <a [href]="b.destinoUrl" [attr.target]="externa(b.destinoUrl)?'_blank':null"
              [attr.rel]="externa(b.destinoUrl)?'sponsored noopener noreferrer':'sponsored'"
              [attr.aria-label]="'Publicidad: '+b.titulo">
              <img [src]="b.imagenUrl" [alt]="b.titulo" loading="lazy">
            </a>
          </article>
        }
      </section>
    }
  `,
  styles:[`
    .banner-promocion{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px auto;padding:0 clamp(20px,4vw,64px)}
    .banner-promocion__item{min-width:0;aspect-ratio:3/1;background:#241b18;border-radius:12px;overflow:hidden;box-shadow:inset 0 0 0 1px #695037}
    .banner-promocion__item a{display:block;width:100%;height:100%;text-decoration:none}
    .banner-promocion__item img{display:block;width:100%;height:100%;object-fit:contain}
    .banner-promocion__item a:focus-visible{outline:2px solid #e3b674;outline-offset:-3px}
    @media(max-width:740px){.banner-promocion{grid-template-columns:1fr}}
  `]
})
export class BannersPromocionComponent implements OnChanges {
  @Input({required:true}) ubicacion='';
  private readonly http=inject(HttpClient);
  readonly banners=signal<BannerPromocion[]>([]);
  private version=0;
  private listo=false;
  constructor(){afterNextRender(()=>{this.listo=true;this.cargar();});}
  ngOnChanges():void{if(this.listo)this.cargar();}
  externa(url:string):boolean{return /^https:\/\//i.test(url);}
  private cargar():void{
    const rev=++this.version;
    this.banners.set([]);
    if(!this.ubicacion)return;
    this.http.get<BannerPromocion[]>('/api/v1/promocion/banners',{
      params:new HttpParams().set('ubicacion',this.ubicacion)
    }).subscribe({
      next:rows=>{if(rev===this.version)this.banners.set(rows.slice(0,2));},
      error:()=>{if(rev===this.version)this.banners.set([]);}
    });
  }
}
