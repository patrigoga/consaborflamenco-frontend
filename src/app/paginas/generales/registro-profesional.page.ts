import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Primera fase: interfaz preparada, sin altas de usuarios.
 * NO activar envíos hasta que existan endpoints seguros de registro/verificación,
 * documentación legal publicada y Google OAuth configurado.
 */
@Component({
  selector: 'csf-registro-profesional',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="registro" aria-labelledby="registro-titulo">
      <header>
        <p class="eyebrow">LA COMUNIDAD DEL FLAMENCO</p>
        <h1 id="registro-titulo">Crea tu perfil profesional</h1>
        <p>Un espacio para artistas, academias, peñas y negocios flamencos.</p>
      </header>

      <button type="button" class="google" disabled aria-describedby="registro-pendiente">
        Continuar con Google
      </button>
      <p class="separador">o con tu correo electrónico</p>

      <form #form="ngForm" novalidate>
        <label for="registro-nombre">Nombre o nombre profesional</label>
        <input id="registro-nombre" name="nombre" [(ngModel)]="nombre" required minlength="2" maxlength="120" autocomplete="name">

        <label for="registro-email">Correo electrónico</label>
        <input id="registro-email" name="email" [(ngModel)]="email" type="email" required email maxlength="254" autocomplete="email">

        <label for="registro-clave">Contraseña</label>
        <input id="registro-clave" name="clave" [(ngModel)]="clave" type="password" required minlength="12" autocomplete="new-password">

        <label for="registro-perfil">Tipo de perfil</label>
        <select id="registro-perfil" name="perfil" [(ngModel)]="perfil" required>
          <option value="ARTISTA">Artista flamenco</option>
          <option value="ACADEMIA">Academia / Escuela</option>
          <option value="ENTIDAD">Peña / Asociación flamenca</option>
          <option value="NEGOCIO">Negocio / Empresa</option>
        </select>

        <div class="legal">
          <label class="casilla">
            <input type="checkbox" name="aceptaTerminos" [(ngModel)]="aceptaTerminos" required>
            <span>Acepto los Términos y condiciones de uso.</span>
          </label>
          <p>He leído la Política de privacidad y entiendo cómo se tratarán mis datos.</p>
          <p>Los enlaces a los textos legales estarán disponibles antes de abrir las altas.</p>
        </div>

        <button class="enviar" type="button" disabled>Crear mi cuenta</button>
        <p id="registro-pendiente" role="status">El registro todavía no está abierto. Estamos preparando la verificación del correo y los documentos legales.</p>
        <section class="promociones" aria-labelledby="promo-titulo">
          <h2 id="promo-titulo">Mantente al día con el flamenco</h2>
          <label class="casilla">
            <input type="checkbox" name="comunicaciones" [(ngModel)]="comunicaciones">
            <span>Quiero recibir novedades, eventos, cursos y promociones por correo electrónico.</span>
          </label>
          <p>Opcional y desmarcado por defecto. Podrás retirar tu consentimiento cuando el servicio esté disponible.</p>
        </section>
      </form>
    </section>
  `,
  styles: [`
    .registro{width:min(100% - 32px,580px);margin:55px auto 70px;background:#fff;color:#241e18;padding:clamp(20px,4vw,42px);border:1px solid #e0d7c5;border-radius:14px;box-shadow:0 10px 30px #00000012}
    h1{font-size:clamp(1.65rem,4vw,2.3rem);margin:8px 0 12px}h2{font-size:1rem;margin:0 0 12px}header p{color:#665b4d}
    .eyebrow{font-size:.78rem;letter-spacing:.12em;color:#996a2d;font-weight:700}
    label:not(.casilla){display:block;margin:17px 0 6px;font-weight:650}
    input:not([type=checkbox]),select{display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid #b9ac9c;border-radius:7px;font:inherit}
    .google,.enviar{width:100%;padding:13px;border:1px solid #aaa;border-radius:7px;font:inherit;font-weight:700}
    .google{background:#fff;margin-top:15px}.enviar{background:#24201b;color:white;margin:18px 0 9px}
    button:disabled{opacity:.63;cursor:not-allowed}.separador{text-align:center;color:#726a62;margin:23px 0 10px}
    .legal{margin-top:24px;padding:16px;border:1px solid #e0d5c7;border-radius:9px}.legal p{font-size:.86rem;color:#675f55}
    .casilla{display:flex;align-items:flex-start;gap:10px;line-height:1.45;cursor:pointer}
    .casilla input{margin-top:5px;accent-color:#956627}.promociones{margin-top:25px;padding:18px 0 0;border-top:1px solid #d5d0c8}
    .promociones p,#registro-pendiente{font-size:.85rem;color:#685f53}
  `]
})
export class RegistroProfesionalComponent {
  nombre = '';
  email = '';
  clave = '';
  perfil: 'ARTISTA'|'ACADEMIA'|'ENTIDAD'|'NEGOCIO' = 'ARTISTA';
  aceptaTerminos = false;
  comunicaciones = false;
}
