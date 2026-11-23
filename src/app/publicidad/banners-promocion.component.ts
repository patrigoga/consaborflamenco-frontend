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
              <div class="banner-promocion__texto">
                <span class="banner-promocion__marca">Publicidad</span>
                <strong>{{b.titulo}}</strong>
                <small>{{b.anunciante}}</small>
              </div>
            </a>
          </article>
        }
      </section>
    }
  `,
  styles:[`
    .banner-promocion{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;
      max-width:1400px;margin:20px auto;padding:0 clamp(16px,4vw,64px)}
    .banner-promocion__item{min-width:0;min-height:108px;border:1px solid #695037;
      background:#241b18;border-radius:12px;overflow:hidden}
    .banner-promocion__item a{display:flex;align-items:stretch;min-height:108px;
      text-decoration:none;color:#fff}
    .banner-promocion__item img{width:40%;max-width:240px;object-fit:cover}
    .banner-promocion__texto{display:flex;flex-direction:column;justify-content:center;gap:7px;padding:14px}
    .banner-promocion__marca{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:#e0b16c}
    .banner-promocion__texto strong{font-size:clamp(.9rem,1.4vw,1.12rem)}
    .banner-promocion__texto small{color:#d6c5b6}
    @media(max-width:740px){.banner-promocion{grid-template-columns:1fr}.banner-promocion__item img{width:35%}}
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
