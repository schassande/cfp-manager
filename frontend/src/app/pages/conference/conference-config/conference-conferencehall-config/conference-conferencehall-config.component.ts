import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conference } from '../../../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-conference-conferencehall-config',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="conferencehall-config">
      <p>{{ 'CONFERENCE.CONFIG.CONFERENCEHALL' | translate }} - {{ conference().name }}</p>
    </div>
  `,
  styleUrls: ['./conference-conferencehall-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConferenceConferencehallConfigComponent {
  readonly conference = input.required<Conference>();
}
