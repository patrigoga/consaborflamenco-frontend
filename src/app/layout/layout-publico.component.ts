import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CabeceraComponent } from './cabecera.component';
import { PieComponent } from './pie.component';
import { BannersPromocionComponent } from '../publicidad/banners-promocion.component';

export function ubicacionPromocion(url:string):string {
  const path=url.split('?')[0].split('#')[0];
  if(path==='/' || path==='')return 'INICIO';
  const m=path.match(/^\/municipios\/([1-9][0-9]*)$/);
  if(m)return 'MUNICIPIO:'+m[1];
  const ubicaciones:Record<string,string>={
    '/revista/artistas':'ARTISTAS','/revista/academias':'ACADEMIAS',
    '/eventos':'EVENTOS','/municipios':'MUNICIPIOS',
    '/revista/fotografia':'FOTOGRAFIA','/revista/moda':'MODA',
    '/revista/penas':'PENAS','/revista/tablaos':'TABLAOS',
    '/revista/festivales':'FESTIVALES','/flamenco/historia':'HISTORIA',
    '/flamenco/palos':'PALOS','/flamenco/llaves-de-oro':'LLAVES',
    '/servicios':'SERVICIOS','/contacto':'CONTACTO'
  };
  return ubicaciones[path] ??
    (path.startsWith('/revista/artistas/')?'ARTISTAS':
    path.startsWith('/eventos/')?'EVENTOS':'');
}
/** Marco común de la web pública. El panel /admin queda fuera. */
@Component({
  selector: 'csf-layout-publico',
  standalone: true,
  imports: [RouterOutlet,CabeceraComponent,PieComponent,BannersPromocionComponent],
  template: `
    <button type="button" class="saltar" (click)="saltarAlContenido()">Saltar al contenido</button>
    <csf-cabecera />
    @if (ubicacion() && ubicacion() !== 'INICIO' && !ubicacion().startsWith('MUNICIPIO:')) {
      <csf-banners-promocion [ubicacion]="ubicacion()" />
    }
    <main id="contenido" tabindex="-1"><router-outlet /></main>
    <csf-pie />
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; outline: none; }
    .saltar { position: absolute; left: 12px; top: -60px; z-index: 50; background: #cda15c; color: #141414; padding: 8px 14px; border-radius: 4px; border: 0; font: inherit; cursor: pointer; }
    .saltar:focus { top: 12px; }
  `]
})
export class LayoutPublicoComponent {
  private readonly router=inject(Router);
  private readonly destroyRef=inject(DestroyRef);
  readonly ubicacion=signal('');
  constructor() {
    afterNextRender(()=>{
      this.ubicacion.set(ubicacionPromocion(this.router.url));
      this.router.events.pipe(filter(e=>e instanceof NavigationEnd),takeUntilDestroyed(this.destroyRef))
        .subscribe(e=>this.ubicacion.set(ubicacionPromocion((e as NavigationEnd).urlAfterRedirects)));
    });
  }
  saltarAlContenido(): void { document.getElementById('contenido')?.focus(); }
}
