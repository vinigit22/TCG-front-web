import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Cada área tem o próprio layout: site (layout-publico), painel da loja e admin (ui/shell)
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
