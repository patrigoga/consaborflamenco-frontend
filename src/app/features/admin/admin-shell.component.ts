import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation, effect, inject, viewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { AvisosService } from './core/avisos.service';
import { ConfirmacionService } from './core/confirmacion.service';

/** Raíz del panel: estilos, avisos y diálogo de confirmación. Nunca se indexa. */
@Component({
  selector: 'adm-shell',
  standalone: true,
  imports: [RouterOutlet],
  encapsulation: ViewEncapsulation.None,
  styleUrl: './admin.css',
  template: `
    <div class="adm">
      <router-outlet />

      <div class="adm-avisos" role="status" aria-live="polite">
        @for (a of avisos.avisos(); track a.id) {
          <div class="adm-aviso" [class.is-error]="a.tipo === 'error'">
            <span>{{ a.texto }}</span>
            <button type="button" class="adm-aviso__cerrar" (click)="avisos.cerrar(a.id)" aria-label="Cerrar aviso">×</button>
          </div>
        }
      </div>

      <dialog #dialogo class="adm-dialogo" (close)="alCerrar()" (cancel)="confirmacion.responder(false)">
        @if (confirmacion.actual(); as p) {
          <form method="dialog" class="adm-dialogo__cuerpo">
            <h2 class="adm-dialogo__titulo">{{ p.titulo }}</h2>
            <p>{{ p.mensaje }}</p>
            <div class="adm-dialogo__acciones">
              <button type="button" class="adm-btn adm-btn--quieto" (click)="confirmacion.responder(false)">{{ p.cancelar ?? 'Cancelar' }}</button>
              <button type="button" class="adm-btn" [class.adm-btn--peligro]="p.peligro" [class.adm-btn--oro]="!p.peligro"
                      (click)="confirmacion.responder(true)">{{ p.aceptar }}</button>
            </div>
          </form>
        }
      </dialog>
    </div>
  `
})
export class AdminShellComponent implements OnInit, OnDestroy {
  readonly avisos = inject(AvisosService);
  readonly confirmacion = inject(ConfirmacionService);
  private readonly meta = inject(Meta);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const abierto = this.confirmacion.actual() !== null;
      const d = this.dialogo().nativeElement;
      if (abierto && !d.open) d.showModal?.();
      if (!abierto && d.open) d.close();
    });
  }

  ngOnInit(): void { this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' }); }
  ngOnDestroy(): void { this.meta.removeTag('name="robots"'); }

  alCerrar(): void { if (this.confirmacion.actual()) this.confirmacion.responder(false); }
}
