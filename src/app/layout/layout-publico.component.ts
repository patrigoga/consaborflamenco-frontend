import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CabeceraComponent } from './cabecera.component';
import { PieComponent } from './pie.component';

/** Marco común de la web pública. El panel /admin tiene el suyo propio. */
@Component({
  selector: 'csf-layout-publico',
  standalone: true,
  imports: [RouterOutlet, CabeceraComponent, PieComponent],
  template: `
    <button type="button" class="saltar" (click)="saltarAlContenido()">Saltar al contenido</button>
    <csf-cabecera />
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
  saltarAlContenido(): void {
    document.getElementById('contenido')?.focus();
  }
}
