import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaPortada, CATEGORIAS_PORTADA, FuentePortada, FuentesPortadaService } from '../../home/fuentes-portada';

@Component({
  standalone: true,
  selector: 'adm-cargar-datos',
  imports: [CommonModule],
  template: `
    <section style="max-width:850px">
      <h1>Cargar datos · Portada</h1>
      <p>Elige qué mostrar por categoría. <strong>JSON</strong> activa contenido ficticio con imágenes para previsualizar la portada; <strong>Base de datos</strong> vuelve al contenido habitual.</p>
      <p role="note" style="padding:14px;border-left:4px solid #b27c2e;background:#fff7e9;color:#34240e">
        Modo de prueba: estos ajustes se guardan únicamente en este navegador.
        No importan datos a MySQL ni cambian lo que ven los demás visitantes.
      </p>
      <div *ngFor="let categoria of categorias" style="padding:20px 0;border-bottom:1px solid #ddd">
        <label [for]="'fuente-'+categoria" style="display:block;margin-bottom:8px;font-weight:700">{{ etiquetas[categoria] }}</label>
        <select [id]="'fuente-'+categoria" [value]="fuentes.fuentes()[categoria]" (change)="cambiar(categoria, $event)" style="min-width:250px;padding:10px;border-radius:5px">
          <option value="bd">Base de datos</option>
          <option value="json">JSON de demostración</option>
        </select>
      </div>
      <p style="margin-top:24px"><a href="/" target="_blank" rel="noopener">Abrir portada para previsualizar ↗</a></p>
    </section>
  `
})
export class CargarDatosComponent {
  readonly fuentes = inject(FuentesPortadaService);
  readonly categorias = CATEGORIAS_PORTADA;
  readonly etiquetas: Record<CategoriaPortada, string> = {
    artistas: 'Artistas', eventos: 'Eventos', academias: 'Academias y cursos', revista: 'Revista flamenca'
  };

  cambiar(categoria: CategoriaPortada, event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    if (valor === 'bd' || valor === 'json') this.fuentes.cambiar(categoria, valor as FuentePortada);
  }
}
