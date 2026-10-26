import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('Portada cinematográfica', () => {
  it('mantiene enlaces reales hacia las secciones y un único título principal', () => {
    TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a[href]')].map(a => a.getAttribute('href'));

    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.querySelector('.cinema-hero__actions a[href="/revista/artistas"]')).not.toBeNull();
    expect(el.querySelector('.cinema-hero__actions a[href="/eventos"]')).not.toBeNull();
    expect(el.querySelector('.cinema-section__heading a[href="/revista/artistas"]')).not.toBeNull();
    expect(el.querySelector('.cinema-section__heading a[href="/eventos"]')).not.toBeNull();
    expect(el.querySelector('.cinema-section__heading a[href="/revista/academias"]')).not.toBeNull();
    expect(el.querySelector('.cinema-section__heading a[href="/flamenco/historia"]')).not.toBeNull();
    expect(el.querySelector('.cinema-join a[href="/membresias"]')).not.toBeNull();
    expect(links.some(href => href?.startsWith('#'))).toBe(false);
  });
});
