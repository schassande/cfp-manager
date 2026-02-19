import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConferenceService } from '../../services/conference.service';
import { Conference } from '../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { UserSignService } from '../../services/usersign.service';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, DataViewModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly conferenceService = inject(ConferenceService);
  private readonly usersignService = inject(UserSignService);
  private readonly router = inject(Router);
  private readonly _conferences = signal<Conference[] | undefined>(undefined);

  conferences = computed(() => this._conferences());
  person = computed(() => this.usersignService.person());


  constructor() {
    this.conferenceService.all().subscribe((confs: Conference[]) => this._conferences.set(confs));
  }

  conferenceDateRange(conf: Conference): { start?: string; end?: string } {
    const sortedDates = [...conf.days]
      .map((day) => day.date)
      .filter((date): date is string => !!date)
      .sort((a, b) => a.localeCompare(b));

    if (!sortedDates.length) {
      return {};
    }

    return { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] };
  }

  cfpDateRange(conf: Conference): { start: string; end: string } | null {
    const start = String(conf.cfp?.startDate ?? '').trim();
    const end = String(conf.cfp?.endDate ?? '').trim();
    if (!start || !end) {
      return null;
    }

    const startTime = Date.parse(start);
    const endTime = Date.parse(end);
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      return null;
    }

    return { start, end };
  }

  openConference(conf: Conference): void {
    const email = this.person()?.email;
    const isOrganizer = !!email && conf.organizerEmails.includes(email);
    const route = isOrganizer ? ['/conference', conf.id, 'manage'] : ['/conference', conf.id];
    void this.router.navigate(route);
  }

  createConference(): void {
    void this.router.navigate(['/conference/create']);
  }
}
