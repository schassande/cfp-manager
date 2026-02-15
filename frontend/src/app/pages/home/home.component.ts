import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConferenceService } from '../../services/conference.service';
import { Conference } from '../../model/conference.model';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { UserSignService } from '../../services/usersign.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, TableModule, ButtonModule],
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

  createConference() {
    this.router.navigate(['/conference', 'create']);
  }
  conferenceToDates(conf: Conference): string[] {
    return conf.days.map(d => d.date);
  }
}
