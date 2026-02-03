import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conference } from '../../../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-conference-planning-structure-config',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="planning-structure-config">
      <p>{{ 'CONFERENCE.CONFIG.PLANNING_STRUCTURE' | translate }} - {{ conference().name }}</p>
    </div>
  `,
  styleUrls: ['./conference-planning-structure-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConferencePlanningStructureConfigComponent {
  readonly conference = input.required<Conference>();
}
