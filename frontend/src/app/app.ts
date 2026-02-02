import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainMenuComponent } from './components/main-menu/main-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
