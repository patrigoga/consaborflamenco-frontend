import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('Portada', () => {
  it('cada bloque tiene su «Ver todos» hacia la página correspondiente y no quedan anclas #', () => {
    TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const verTodos = [...el.querySelectorAll('.section-head > a')].map(a => [a.textContent?.trim(), a.getAttribute('href')]);
    expect(verTodos).toEqual([
      ['Ver todos los eventos', '/eventos'],
      ['Ver todos los artistas', '/revista/artistas'],
      ['Ver todas las academias', '/revista/academias'],
      ['Ver todo sobre el flamenco', '/flamenco/historia']
    ]);
    expect(el.querySelectorAll('a[href^="#"]').length).toBe(0);
    expect(el.querySelector('.cta a')?.getAttribute('href')).toBe('/membresias');
    expect(el.querySelectorAll('h1').length).toBe(1);
  });
});
