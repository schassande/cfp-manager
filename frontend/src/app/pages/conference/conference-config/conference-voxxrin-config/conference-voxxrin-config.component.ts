import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conference } from '../../../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-conference-voxxrin-config',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="voxxrin-config">
      <p>{{ 'CONFERENCE.CONFIG.VOXXRIN' | translate }} - {{ conference().name }}</p>
    </div>
  `,
  styleUrls: ['./conference-voxxrin-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConferenceVoxxrinConfigComponent {
  readonly conference = input.required<Conference>();
}
