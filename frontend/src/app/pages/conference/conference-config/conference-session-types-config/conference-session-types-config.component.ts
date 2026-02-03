import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conference } from '../../../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-conference-session-types-config',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="session-types-config">
      <p>{{ 'CONFERENCE.CONFIG.SESSION_TYPES' | translate }} - {{ conference().name }}</p>
    </div>
  `,
  styleUrls: ['./conference-session-types-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConferenceSessionTypesConfigComponent {
  readonly conference = input.required<Conference>();
}
