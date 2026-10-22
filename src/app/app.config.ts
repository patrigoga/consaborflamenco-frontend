import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { TitleStrategy, provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { adminInterceptor } from './features/admin/core/admin.interceptor';
import { SeoTitleStrategy } from './seo/seo-title.strategy';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(
      withFetch(),
      // Spring Security entrega XSRF-TOKEN; Angular lo devuelve en X-XSRF-TOKEN en POST/PUT/DELETE relativos.
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([adminInterceptor])
    )
  ]
};
