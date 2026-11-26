import { afterNextRender, Component, OnDestroy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BannersMunicipalesComponent } from '../../publicidad/banners-municipales.component';
import { PromocionesMunicipioComponent } from './promociones-municipio.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

interface Municipio {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  provincia_slug: string;
  provincia_id: number;
  region: string;
  region_id: number;
  pais: string;
  pais_id: number;
}
interface EventoMunicipal {
  id: number;
  slug: string;
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  lugar: string | null;
  cartel_url: string | null;
}
interface ArtistaMunicipal {
  id: number;
  nombre: string;
  slug: string;
  disciplina: string;
  foto_url: string | null;
}

/** Directorio y portada municipal. Comparte datos con artistas y no crea copias. */
@Component({
  selector: 'csf-municipios',
  standalone: true,
  imports: [RouterLink, DatePipe, PromocionesMunicipioComponent, BannersMunicipalesComponent],
  template: `
    <section class="municipios">
      <header class="cabecera">
        <p class="kicker">CON SABOR FLAMENCO · TERRITORIOS</p>
        <h1>{{ municipio() ? 'Flamenco en ' + municipio()!.nombre : 'Municipios del Flamenco' }}</h1>
        <p>Artistas, cultura y tradición flamenca de nuestros pueblos y ciudades.</p>
        <a routerLink="/municipios" class="volver">Explorar todos los municipios</a>
      </header>
      @if (error()) { <p class="estado" role="alert">{{ error() }}</p> }
      @if (cargando()) { <p class="estado" role="status">Cargando municipios…</p> }
      @if (municipio(); as lugar) {
        <csf-banners-municipales [municipioId]="lugar.id" />
        <csf-promociones-municipio [municipioId]="lugar.id" />
        <nav class="ruta" aria-label="Jerarquía geográfica">
          <span>{{ lugar.pais }}</span><span aria-hidden="true"> / </span>
          <span>{{ lugar.region }}</span><span aria-hidden="true"> / </span>
          <span>{{ lugar.provincia }} (provincia)</span><span aria-hidden="true"> / </span>
          <strong>{{ lugar.nombre }}</strong>
        </nav>
        <h2>Artistas de {{ lugar.nombre }}</h2>
        @if (artistas().length) {
          <div class="tarjetas">
            @for (a of artistas(); track a.id) {
              <a class="tarjeta" [routerLink]="['/revista/artistas', a.slug]">
                @if (a.foto_url) { <img [src]="a.foto_url" [alt]="'Fotografía de ' + a.nombre" loading="lazy"> }
                @else { <div class="sin-foto" aria-hidden="true">♫</div> }
                <div class="datos"><strong>{{ a.nombre }}</strong><small>{{ a.disciplina }}</small></div>
              </a>
            }
          </div>
        } @else if (!cargando() && !error()) {
          <div class="vacio"><p>Aún no tenemos artistas publicados vinculados a este municipio.</p>
          <a routerLink="/registro">¿Eres artista? Regístrate</a></div>
        }
        <h2>Próximos eventos en {{ lugar.nombre }}</h2>
        @if (eventos().length) {
          <div class="tarjetas">
            @for (evento of eventos(); track evento.id) {
              <a class="tarjeta" [routerLink]="['/eventos', evento.slug]">
                @if (evento.cartel_url) { <img [src]="evento.cartel_url" [alt]="'Cartel de ' + evento.titulo" loading="lazy"> }
                @else { <div class="sin-foto" aria-hidden="true">♫</div> }
                <div class="datos"><strong>{{ evento.titulo }}</strong><small>{{ evento.fecha_inicio | date:'dd/MM/yyyy HH:mm' }}</small>
                  @if (evento.lugar) { <span>{{ evento.lugar }}</span> }
                </div>
              </a>
            }
          </div>
        } @else if (!cargandoEventos()) {
          <div class="vacio"><p>De momento no hay eventos próximos publicados en este municipio.</p>
            <a routerLink="/mi-cuenta/eventos/nuevo">Publica tu evento</a></div>
        }
        <div class="secciones">
          <section><h2>Eventos</h2><p>Próximamente podrás descubrir la agenda flamenca local.</p><a routerLink="/eventos">Consultar agenda general</a></section>
          <section><h2>Academias y escuelas</h2><p>Estamos preparando el directorio de centros del municipio.</p><a routerLink="/revista/academias">Explorar academias</a></section>
          <section><h2>Peñas y asociaciones</h2><p>Conoce a las entidades que mantienen viva la cultura flamenca.</p><a routerLink="/revista/penas">Explorar peñas</a></section>
        </div>
      } @else {
        <form class="buscador" (submit)="buscar($event)">
          <label for="municipio-buscar">Busca por municipio</label>
          <div><input id="municipio-buscar" name="q" type="search" maxlength="100" [value]="consulta()" (input)="alEscribir($any($event.target).value)" placeholder="Ej.: Montilla, Utrera…" autocomplete="off">
          <button type="submit">Buscar</button></div>
        </form>
        @if (buscando()) { <p class="estado" role="status">Buscando municipios…</p> }
        <div class="tarjetas localidades">
          @for (lugar of municipios(); track lugar.id) {
            <a class="tarjeta" [routerLink]="['/municipios', lugar.slug, lugar.provincia_slug]"><div class="datos">
              <strong>{{ lugar.nombre }}</strong>
              <small>{{ lugar.provincia }} · {{ lugar.region }}</small>
              <span>Descubrir municipio →</span>
            </div></a>
          }
        </div>
        @if (!municipios().length && !cargando() && !error()) {
          <p class="estado">Todavía no hay municipios disponibles con este nombre.</p>
        }
      }
    </section>`,
  styles: [`
    :host{display:block;background:#121116;color:#f7f1e8;min-height:75vh}
    .municipios{--municipios-gutter:clamp(20px,4vw,64px);width:100%;padding:0 var(--municipios-gutter) 80px}
    .cabecera{background:linear-gradient(120deg,#301d1b,#101015);padding:clamp(48px,7vw,112px) clamp(22px,5.2vw,86px);margin:0 calc(-1 * var(--municipios-gutter)) 38px}
    .kicker{font-size:.75rem;letter-spacing:.19em;color:#dbb06b;font-weight:750}
    h1{font:400 clamp(40px,4.35vw,74px)/1.05 Georgia,serif;margin:14px 0;overflow-wrap:anywhere}
    h2{font:600 clamp(23px,2.5vw,33px)/1.2 Georgia,serif;margin:40px 0 18px}
    .cabecera p{max-width:650px;line-height:1.6}
    a{color:inherit}
    .volver,.secciones a{color:#dfb878}
    .ruta{display:flex;flex-wrap:wrap;gap:9px;color:#d4b786;font-size:.85rem}
    .buscador{max-width:680px;margin-bottom:35px}
    .buscador label{display:block;margin-bottom:9px;font-weight:650}
    .buscador div{display:flex;gap:12px}
    .buscador input{flex:1;min-width:0;padding:14px;border:1px solid #978671;border-radius:6px;font:inherit}
    .buscador button{border:0;border-radius:6px;padding:12px 23px;background:#cf9e57;color:#21170d;font-weight:750;cursor:pointer}
    .tarjetas{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.localidades{grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))}
    .tarjeta{display:flex;flex-direction:column;border:1px solid #51443d;background:#1c1815;border-radius:9px;overflow:hidden;text-decoration:none}
    .tarjeta:hover,.tarjeta:focus-visible{border-color:#d3a35d}
    .tarjeta img,.sin-foto{width:100%;aspect-ratio:16/10;object-fit:cover}
    .sin-foto{display:grid;place-items:center;background:#392b2a;font-size:4rem;color:#d3aa71}
    .datos{display:flex;flex-direction:column;gap:8px;padding:16px}
    .datos strong{font:600 19px/1.2 Georgia,serif;overflow-wrap:anywhere}.datos small{color:#e4cba8}.datos span{font-size:.85rem;color:#deb06c}
    .localidades .tarjeta{min-height:125px;justify-content:center}
    .secciones{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;margin-top:42px}
    .secciones section,.vacio{border:1px solid #4d413c;border-radius:10px;padding:22px;background:#1e1b21}
    .secciones h2{margin:0 0 10px;font-size:1.1rem}.secciones p,.vacio p{color:#ddd1c5;line-height:1.5}
    .estado{padding:20px}.vacio a{color:#e4ba7c}
    @media(max-width:1050px){.tarjetas:not(.localidades){grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:600px){.buscador div{flex-direction:column}.tarjetas:not(.localidades){grid-template-columns:1fr}.cabecera{padding:38px var(--municipios-gutter)}}
  `]
})
export class MunicipiosPage implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private revisionMunicipio = 0;
  readonly consulta = signal('');
  readonly buscando = signal(false);
  private temporizador?: ReturnType<typeof setTimeout>;
  private revisionBusqueda = 0;
  readonly municipios = signal<Municipio[]>([]);
  readonly municipio = signal<Municipio | null>(null);
  readonly artistas = signal<ArtistaMunicipal[]>([]);
  readonly eventos = signal<EventoMunicipal[]>([]);
  readonly cargandoEventos = signal(true);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor() {
    afterNextRender(() => this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      ++this.revisionMunicipio;
      this.municipio.set(null);
      this.artistas.set([]);
      this.eventos.set([]);
      this.error.set('');
      if (params.has('id') || params.has('municipio')) {
        clearTimeout(this.temporizador);
        ++this.revisionBusqueda;
        this.buscando.set(false);
        if (params.has('id') && (!Number.isSafeInteger(id) || id < 1)) {
          this.cargando.set(false);
          this.error.set('El municipio solicitado no es válido.');
          return;
        }
        const url = params.has('id') ? '/api/v1/territorio/municipios/' + id :
          '/api/v1/territorio/municipios/por-nombre/' + encodeURIComponent(params.get('provincia')!) + '/' + encodeURIComponent(params.get('municipio')!);
        this.cargarMunicipio(url, params.has('id'));
      } else this.buscarMunicipios();
    }));
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
    ++this.revisionBusqueda;
  }

  alEscribir(texto: string): void {
    this.consulta.set(texto);
    this.municipios.set([]);
    clearTimeout(this.temporizador);
    ++this.revisionBusqueda;
    this.error.set('');
    this.buscando.set(true);
    // La búsqueda se ejecuta mientras se escribe, sin pedir un clic.
    this.temporizador = setTimeout(() => this.buscarMunicipios(), 300);
  }

  buscar(event: Event): void {
    event.preventDefault();
    clearTimeout(this.temporizador);
    this.buscarMunicipios();
  }

  private buscarMunicipios(): void {
    clearTimeout(this.temporizador);
    const revision = ++this.revisionBusqueda;
    this.buscando.set(true);
    this.error.set('');
    this.http.get<Municipio[]>('/api/v1/territorio/municipios', {
      params: new HttpParams().set('q', this.consulta().trim().slice(0, 100))
    }).subscribe({
      next: rows => {
        if (revision !== this.revisionBusqueda) return;
        this.municipios.set(rows);
        this.buscando.set(false);
        this.cargando.set(false);
      },
      error: () => {
        if (revision !== this.revisionBusqueda) return;
        this.municipios.set([]);
        this.error.set('No podemos consultar los municipios ahora.');
        this.buscando.set(false);
        this.cargando.set(false);
      }
    });
  }

  private cargarMunicipio(url: string, redirigir: boolean): void {
    const revision = this.revisionMunicipio;
    this.cargando.set(true);
    this.http.get<Municipio>(url).subscribe({
      next: lugar => {
        if (revision !== this.revisionMunicipio) return;
        if (redirigir) {
          void this.router.navigate(['/municipios', lugar.slug, lugar.provincia_slug], { replaceUrl: true });
          return;
        }
        const id = lugar.id;
        this.municipio.set(lugar);
        this.cargandoEventos.set(true);
        this.http.get<EventoMunicipal[]>('/api/v1/territorio/municipios/' + id + '/eventos').subscribe({
          next: rows => { if(revision===this.revisionMunicipio){this.eventos.set(rows); this.cargandoEventos.set(false);} },
          error: () => { if(revision===this.revisionMunicipio){this.eventos.set([]); this.cargandoEventos.set(false);} }
        });
        this.http.get<ArtistaMunicipal[]>('/api/v1/territorio/artistas', {
          params: new HttpParams().set('nivel', 'municipio').set('id', id)
        }).subscribe({
          next: rows => { if(revision===this.revisionMunicipio){this.artistas.set(rows); this.cargando.set(false);} },
          error: () => { if(revision===this.revisionMunicipio){this.error.set('No podemos cargar los artistas del municipio.'); this.cargando.set(false);} }
        });
      },
      error: () => { if(revision===this.revisionMunicipio){this.error.set('No se ha encontrado el municipio solicitado.'); this.cargando.set(false);} }
    });
  }
}
