import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conference } from '../../../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-conference-tracks-config',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="tracks-config">
      <p>{{ 'CONFERENCE.CONFIG.TRACKS' | translate }} - {{ conference().name }}</p>
    </div>
  `,
  styleUrls: ['./conference-tracks-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConferenceTracksConfigComponent {
  readonly conference = input.required<Conference>();
}
