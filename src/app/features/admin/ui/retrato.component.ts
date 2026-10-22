import { Component, computed, input } from '@angular/core';

/** Miniatura del artista; si no hay foto, sus iniciales sobre el negro de la marca. */
@Component({
  selector: 'adm-retrato',
  standalone: true,
  template: `
    @if (url()) {
      <img [src]="url()" [alt]="'Fotografía de ' + nombre()" loading="lazy" decoding="async">
    } @else {
      <span aria-hidden="true">{{ iniciales() }}</span>
    }
  `,
  host: { class: 'adm-retrato', '[class.adm-retrato--grande]': 'grande()' }
})
export class RetratoComponent {
  readonly url = input<string | null>(null);
  readonly nombre = input.required<string>();
  readonly grande = input(false);
  readonly iniciales = computed(() =>
    this.nombre().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join(''));
}
