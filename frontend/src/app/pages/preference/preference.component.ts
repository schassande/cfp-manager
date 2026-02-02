import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-preference',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="preference-container">
      <h2>{{ 'PREFERENCE.TITLE' | translate }}</h2>
      <p>{{ 'PREFERENCE.DESCRIPTION' | translate }}</p>
      <!-- Préférences utilisateur à ajouter ici -->
    </section>
  `,
  styles: [`
    .preference-container {
      max-width: 600px;
      margin: 40px auto;
      padding: 32px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      text-align: left;
    }
    h2 { color: #1976d2; margin-bottom: 16px; }
  `]
})
export class PreferenceComponent {}
