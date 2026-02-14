import { ChangeDetectionStrategy, Component, input, inject, OnInit, signal, computed, ChangeDetectorRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Conference } from '../../../../model/conference.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConferenceService } from '../../../../services/conference.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-conference-general-config',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    MultiSelectModule,
    ToggleButtonModule,
    CardModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './conference-general-config.component.html',
  styleUrls: ['./conference-general-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConferenceGeneralConfigComponent implements OnInit {
  // Inputs
  readonly conference = input.required<Conference>();

  // Private injects
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly translateService = inject(TranslateService);

  // State
  protected readonly form = signal<FormGroup | null>(null);
  readonly languageOptions = signal([
    { label: 'Français', value: 'FR' },
    { label: 'English', value: 'EN' },
    { label: 'Español', value: 'ES' },
    { label: 'Deutsch', value: 'DE' },
    { label: 'Italiano', value: 'IT' },
  ]);

  // Computed
  protected readonly currentForm = computed(() => this.form());
  readonly organizerEmails = computed(() => {
    return this.currentForm()?.get('organizerEmails')?.value || [];
  });

  ngOnInit() {
    const conf = this.conference();
    this.form.set(this.fb.group({
      name:            [conf.name,            [Validators.required, Validators.minLength(3)]],
      location:        [conf.location,        [Validators.required]],
      logo:            [conf.logo,            []],
      languages:       [conf.languages,       [Validators.required]],
      visible:         [conf.visible,         [Validators.required]],
      organizerEmails: [conf.organizerEmails, [Validators.required]],
    }));
    this.form()?.valueChanges.subscribe((values) => {
      const c = this.conference();
      c.name = values.name;
      c.location = values.location;
      c.languages = values.languages;
      c.visible = values.visible;
      c.organizerEmails = values.organizerEmails;
    })
  }

  addOrganizerEmail(email: string) {
    const emails = this.currentForm()!.get('organizerEmails')?.value || [];
    if (email && !emails.includes(email)) {
      this.currentForm()!.patchValue({organizerEmails: [...emails, email]});
    }
  }

  removeOrganizerEmail(email: string) {
    const emails = this.currentForm()!.get('organizerEmails')?.value || [];
    this.currentForm()!.patchValue({
      organizerEmails: emails.filter((e: string) => e !== email),
    });
  }
}
