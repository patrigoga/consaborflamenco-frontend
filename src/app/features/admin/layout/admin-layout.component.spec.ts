import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

describe('AdminLayoutComponent', () => {
  it('«Saltar al contenido» mueve el foco al contenido sin navegar a otra página', () => {
    TestBed.configureTestingModule({ imports: [AdminLayoutComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    expect(el.querySelectorAll('a[href^="#"]').length).toBe(0);
    el.querySelector<HTMLButtonElement>('.adm-saltar')!.click();
    expect(document.activeElement?.id).toBe('adm-contenido');
    el.remove();
  });
});
