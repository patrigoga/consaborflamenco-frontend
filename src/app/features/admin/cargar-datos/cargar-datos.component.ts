import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaPortada, CATEGORIAS_PORTADA, FuentePortada, FuentesPortadaService } from '../../home/fuentes-portada';

@Component({
  standalone: true,
  selector: 'adm-cargar-datos',
  imports: [CommonModule],
  template: `
    <section style="max-width:850px">
      <h1>Cargar datos · Portada</h1>
      <p>Elige el contenido público por categoría. Los cambios se guardan en la base de datos y los verán todos los visitantes hasta que los modifiques.</p>
      <p role="note" style="padding:14px;border-left:4px solid #b27c2e;background:#fff7e9;color:#34240e">
        JSON publica las tarjetas de ejemplo que ya están incluidas en la web; no crea artistas, cursos ni eventos reales en MySQL. Base de datos muestra el contenido habitual.
      </p>
      @if (mensaje()) { <p role="status">{{ mensaje() }}</p> }
      @if (error()) { <p role="alert" class="adm-alerta">{{ error() }}</p> }
      @if (!fuentes.cargadas()) { <p>Consultando configuración pública…</p> }
      @for (categoria of categorias; track categoria) {
        <div style="padding:20px 0;border-bottom:1px solid #ddd">
          <label [for]="'fuente-'+categoria" style="display:block;margin-bottom:8px;font-weight:700">{{ etiquetas[categoria] }}</label>
          <select [id]="'fuente-'+categoria" [value]="fuentes.fuentes()[categoria]"
                  [disabled]="!fuentes.cargadas() || guardando()"
                  (change)="cambiar(categoria, $event)" style="min-width:250px;padding:10px;border-radius:5px">
            <option value="bd">Base de datos</option>
            <option value="json">JSON publicado</option>
          </select>
        </div>
      }
      <p style="margin-top:24px"><a href="/" target="_blank" rel="noopener">Abrir portada pública ↗</a></p>
    </section>
  `
})
export class CargarDatosComponent implements OnInit {
  readonly fuentes = inject(FuentesPortadaService);
  readonly categorias = CATEGORIAS_PORTADA;
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly etiquetas: Record<CategoriaPortada, string> = {
    artistas: 'Artistas', eventos: 'Eventos', academias: 'Academias y cursos', revista: 'Revista flamenca'
  };

  ngOnInit(): void {
    this.fuentes.cargar().subscribe({
      error: () => this.error.set('No se pudo cargar la configuración. Los cambios están desactivados.')
    });
  }

  cambiar(categoria: CategoriaPortada, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const valor = select.value;
    if (valor !== 'bd' && valor !== 'json') return;
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.fuentes.cambiar(categoria, valor as FuentePortada).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set('Configuración guardada. Ya se aplica a los visitantes de la portada.');
      },
      error: () => {
        this.guardando.set(false);
        select.value = this.fuentes.fuentes()[categoria];
        this.error.set('No se pudo guardar. La configuración anterior sigue activa.');
      }
    });
  }
}
