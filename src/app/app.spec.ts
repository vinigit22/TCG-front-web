import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { LayoutPublico } from './layout-publico/layout-publico';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, LayoutPublico],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('o layout do site tem cabeçalho e rodapé', async () => {
    const fixture = TestBed.createComponent(LayoutPublico);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header nav')).toBeTruthy();
    expect(compiled.querySelector('app-footer footer')).toBeTruthy();
  });
});
