import { Component, Input, OnChanges, OnDestroy, OnInit, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Promocion {
  tipo: 'HERO' | 'BANNER';
  posicion: number;
  titulo: string;
  subtitulo: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  cta_texto: string | null;
  cta_url: string | null;
  anunciante: string | null;
  es_publicidad: boolean;
}

/** Hasta 3 diapositivas y 3 banners por municipio, con fallback cultural. */
@Component({
  selector: 'csf-promociones-municipio',
  standalone: true,
  template: `
    @if (hero().length) {
      <section class="slider" aria-label="Destacados del municipio">
        @if (actual(); as destacado) {
          @if (destacado.imagen_url) {
            <img class="slider__imagen" [src]="destacado.imagen_url" [alt]="'Imagen de ' + destacado.titulo">
          }
          <div class="slider__contenido">
            <span class="etiqueta">{{ destacado.es_publicidad ? 'Publicidad' : 'Destacado cultural' }}</span>
            <p class="slider__titulo">{{ destacado.titulo }}</p>
            @if (destacado.subtitulo) { <p class="subtitulo">{{ destacado.subtitulo }}</p> }
            @if (destacado.descripcion) { <p class="descripcion">{{ destacado.descripcion }}</p> }
            @if (destacado.cta_url && destacado.cta_texto) {
              <a class="boton" [href]="destacado.cta_url" [attr.target]="esExterna(destacado.cta_url) ? '_blank' : null"
                 [attr.rel]="esExterna(destacado.cta_url) ? 'noopener noreferrer' : null">{{ destacado.cta_texto }}</a>
            }
          </div>
          @if (hero().length > 1) {
            <nav class="controles" aria-label="Controles de destacados">
              <button type="button" (click)="anterior()" aria-label="Destacado anterior">‹</button>
              <span>{{ indice() + 1 }} / {{ hero().length }}</span>
              <button type="button" (click)="siguiente()" aria-label="Destacado siguiente">›</button>
            </nav>
          }
        }
      </section>
    }
    @if (banners().length) {
      <section class="banners" aria-label="Promociones locales">
        @for (banner of banners(); track banner.posicion) {
          <article class="banner">
            @if (banner.imagen_url) { <img [src]="banner.imagen_url" [alt]="'Imagen de ' + banner.titulo" loading="lazy"> }
            <div class="banner__contenido">
              <span class="etiqueta">{{ banner.es_publicidad ? 'Publicidad' : 'Colaboración cultural' }}</span>
              <strong>{{ banner.titulo }}</strong>
              @if (banner.subtitulo) { <small>{{ banner.subtitulo }}</small> }
              @if (banner.cta_url && banner.cta_texto) {
                <a [href]="banner.cta_url" [attr.target]="esExterna(banner.cta_url) ? '_blank' : null"
                   [attr.rel]="esExterna(banner.cta_url) ? 'noopener noreferrer' : null">{{ banner.cta_texto }}</a>
              }
            </div>
          </article>
        }
      </section>
    }
  `,
  styles: [`
    :host{display:block}
    .slider{position:relative;min-height:clamp(250px,34vw,430px);background:linear-gradient(115deg,#3b2420,#101014);display:flex;align-items:flex-end;overflow:hidden;border-radius:12px;margin:12px 0 28px}
    .slider::after{position:absolute;inset:0;content:'';background:linear-gradient(90deg,#151217e8 0%,#1512178a 65%,#15121733);pointer-events:none}
    .slider__imagen{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .slider__contenido{position:relative;z-index:1;padding:clamp(24px,5vw,52px);max-width:720px}
    .etiqueta{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:#e9b773;font-weight:800}
    .slider__titulo{font-size:clamp(1.6rem,3vw,2.9rem);font-weight:800;line-height:1.08;margin:10px 0;color:#fff}
    .subtitulo{font-size:1.1rem;margin:10px 0}.descripcion{max-width:560px;line-height:1.5}
    .boton{display:inline-block;background:#d4a061;color:#1c120a!important;padding:10px 18px;border-radius:7px;text-decoration:none;font-weight:750;margin-top:12px}
    .controles{position:absolute;z-index:2;right:15px;bottom:14px;display:flex;align-items:center;gap:8px;background:#101015c9;padding:4px 8px;border-radius:25px}
    .controles button{background:transparent;color:white;border:1px solid #ccc7;border-radius:50%;width:32px;height:32px;font-size:1.4rem;cursor:pointer}
    .controles span{font-size:.8rem;color:#fff}
    .banners{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0 0 26px}
    .banner{min-width:0;min-height:118px;background:#272027;border:1px solid #59463b;border-radius:9px;display:flex;overflow:hidden}
    .banner img{width:37%;object-fit:cover}
    .banner__contenido{display:flex;flex-direction:column;justify-content:center;gap:7px;padding:13px;min-width:0}
    .banner strong{font-size:.95rem}.banner small{color:#dfd2c5}
    .banner a{color:#e5ba7d;font-size:.83rem}
    @media(max-width:800px){.banners{grid-template-columns:1fr}.banner{min-height:90px}.banner img{width:28%}.slider__contenido{padding-bottom:66px}}
  `]
})
export class PromocionesMunicipioComponent implements OnChanges, OnInit, OnDestroy {
  @Input({required: true}) municipioId!: number;
  private readonly http = inject(HttpClient);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private revision=0;
  private temporizador?: ReturnType<typeof setInterval>;
  readonly promociones = signal<Promocion[]>([]);
  readonly nuevasPosiciones = signal<number[]>([]);
  readonly hero = computed(() => this.promociones().filter(p => p.tipo === 'HERO').sort((a,b) => a.posicion-b.posicion));
  // Si un espacio ya usa el nuevo sistema se evita su duplicado legacy.
  // Los otros espacios históricos se conservan hasta que se revisen sus contratos.
  readonly banners = computed(() => this.promociones()
    .filter(p => p.tipo === 'BANNER' && !this.nuevasPosiciones().includes(p.posicion))
    .sort((a,b) => a.posicion-b.posicion));
  readonly indice = signal(0);
  readonly actual = computed(() => this.hero()[this.indice()] ?? null);

  ngOnChanges(): void {
    if (!this.esNavegador) return;
    if (this.municipioId > 0) this.cargar();
    else { this.revision++;this.promociones.set([]);this.nuevasPosiciones.set([]);this.indice.set(0); }
  }
  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.temporizador = setInterval(() => this.siguiente(), 7000);
  }
  ngOnDestroy(): void { this.revision++;if (this.temporizador) clearInterval(this.temporizador); }
  siguiente(): void { const n=this.hero().length; if (n>1) this.indice.update(i => (i+1)%n); }
  anterior(): void { const n=this.hero().length; if (n>1) this.indice.update(i => (i+n-1)%n); }
  esExterna(url: string): boolean { return /^https:\/\//i.test(url); }

  private cargar(): void {
    this.promociones.set([]);
    this.nuevasPosiciones.set([]);
    this.indice.set(0);
    const id = this.municipioId, revision = ++this.revision;
    this.http.get<{posicion:number}[]>('/api/v1/promocion/banners?ubicacion=MUNICIPIO:' + id)
      .subscribe({ next:items=>{if(revision===this.revision)this.nuevasPosiciones.set(items.map(x=>x.posicion));},
                   error:()=>{} });
    this.http.get<Promocion[]>('/api/v1/territorio/municipios/' + this.municipioId + '/promociones').subscribe({
      next: items => { if(revision!==this.revision)return;this.promociones.set(items); this.indice.set(0); },
      error: () => {if(revision===this.revision)this.promociones.set([]);}
    });
  }
}
