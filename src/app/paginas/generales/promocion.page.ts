import { Component, afterNextRender, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { SolicitudBannerComponent } from '../../publicidad/solicitud-banner.component';
interface Tarifa {
 codigo:string;descripcion:string;precioMensualCentimos:number;
 descuentoPorcentaje:number;precioFinalCentimos:number;activo:boolean;
}
@Component({
  selector:'csf-promocion',standalone:true,imports:[SolicitudBannerComponent],
  template:`
    <main class="promocion">
      <header><span class="ceja">PUBLICIDAD · CONSABORFLAMENCO</span>
        <h1>Promociona tu arte o negocio</h1>
        <p>Presenta tus servicios a personas interesadas en el flamenco.
          Publicidad por páginas, categorías y municipios.</p>
      </header>
      @if(municipioId() && posicion()){
        <csf-solicitud-banner [municipioId]="municipioId()" [posicion]="posicion()" />
      }
      <section aria-labelledby="tarifario"><h2 id="tarifario">Espacios disponibles y tarifas</h2>
        <div class="lista">
          @for(t of tarifas();track t.codigo){
            @if(t.activo){
              <article class="tarifa">
                <h3>{{t.descripcion}}</h3>
                @if(t.descuentoPorcentaje>0){
                  <p class="antes">{{(t.precioMensualCentimos/100).toFixed(2)}} €/mes</p>
                  <strong class="oferta">Oferta -{{t.descuentoPorcentaje}} %</strong>
                }
                <strong class="precio">{{(t.precioFinalCentimos/100).toFixed(2)}} € <small>/mes</small></strong>
                <p>Dos posiciones publicitarias por ubicación. Sujeto a disponibilidad.</p>
              </article>
            }
          }
        </div>
        @if(error()){<p role="alert">No podemos cargar los precios en este momento.</p>}
      </section>
      <section class="informacion">
        <h2>¿Cómo funciona?</h2>
        <p>La promoción se prepara según la página, categoría o municipio donde quieres aparecer.
          Cada banner se identifica como publicidad y se programa por fechas.</p>
        <p><strong>Las tarifas son informativas, sin IVA.</strong> No existe todavía contratación
          ni pago automático desde esta página; la disponibilidad y condiciones se deben confirmar previamente.</p>
        <p>Para solicitar un banner municipal, visita el municipio y pulsa uno de sus espacios disponibles. El administrador confirmará la contratación y podrás gestionar el anuncio desde «Mis banners».</p>
      </section>
    </main>
  `,
  styles:[`
    :host{display:block;background:#14100e;color:#f7ede0}
    .promocion{max-width:1160px;margin:auto;padding:48px 20px 90px}
    header{padding:35px 0 45px}h1{font:normal clamp(36px,5vw,64px) Georgia,serif;margin:15px 0}
    header p{max-width:700px;line-height:1.7;color:#e0cbb5}
    .ceja{color:#ddb477;letter-spacing:.13em;font-size:.75rem}
    h2{font:normal 30px Georgia,serif}
    .lista{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:15px}
    .tarifa{padding:24px;border:1px solid #765837;border-radius:12px;background:#241a15}
    h3{font:normal 22px Georgia,serif}
    .antes{text-decoration:line-through;color:#ae9b88}
    .oferta{display:block;color:#f1c17a;font-size:.9rem}
    .precio{display:block;font-size:32px;margin:14px 0}
    .precio small{font-weight:normal;font-size:14px}
    .tarifa p,.informacion p{line-height:1.6;color:#d6c6b5}
    .informacion{margin-top:50px;max-width:800px}
    .informacion a{color:#f5cd86}
  `]
})
export class PromocionPage {
  private readonly http=inject(HttpClient);
  readonly tarifas=signal<Tarifa[]>([]);
  readonly error=signal(false);
  readonly municipioId=signal(0);readonly posicion=signal(0);
  private readonly route=inject(ActivatedRoute);
  private readonly destroyRef=inject(DestroyRef);
  constructor(){
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p=>{
      const id=Number(p.get('municipio')),pos=Number(p.get('posicion'));
      this.municipioId.set(Number.isSafeInteger(id)&&id>0?id:0);this.posicion.set(pos===1||pos===2?pos:0);
    });
    afterNextRender(()=>this.http.get<Tarifa[]>('/api/v1/promocion/tarifas').subscribe({
      next:r=>this.tarifas.set(r),error:()=>this.error.set(true)
    }));
  }
}
