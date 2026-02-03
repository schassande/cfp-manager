import { ChangeDetectionStrategy, Component, computed, signal, inject, effect } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserSignService } from '../../services/usersign.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [RouterModule, AvatarModule, ButtonModule, TooltipModule, MenuModule, TranslateModule],
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainMenuComponent {
  private readonly signupService = inject(UserSignService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  person = computed(() => this.signupService.person());
  private readonly _avatarMenuItems = signal<MenuItem[]>([]);
  avatarMenuItems = computed(() => this._avatarMenuItems());

  private readonly _adminMenuItems = signal<MenuItem[]>([]);
  adminMenuItems = computed(() => this._adminMenuItems());

  private readonly _languageMenuItems = signal<MenuItem[]>([]);
  languageMenuItems = computed(() => this._languageMenuItems());
  private readonly _currentLang = signal(this.translate.currentLang || this.translate.getDefaultLang() || 'en');
  currentFlagPath = computed(() => (this._currentLang() === 'fr' ? 'assets/flags/fr.svg' : 'assets/flags/en.svg'));

  constructor() {
    void this.refreshMenuLabels();
    this.translate.onLangChange.subscribe(event => {
      this._currentLang.set(event.lang);
      void this.refreshMenuLabels();
    });
    // Rebuild avatar menu whenever person signal changes
    effect(() => {
      this.person();
      void this.setMenuItems();
      void this.setAdminMenuItems();
    });
  }

  private async setMenuItems() {
    const labels = await firstValueFrom(this.translate.get(['MENU.PROFILE', 'MENU.LOGOUT']));
    const items: MenuItem[] = [
      {
        label: labels['MENU.PROFILE'],
        icon: 'pi pi-cog',
        command: () => this.router.navigate(['/preference'])
      }
    ];

    // If current user is platform admin, add an Admin submenu with Persons entry
    const p = this.person();
    if (p && p.isPlatformAdmin) {
      const adminGroupLabel = await firstValueFrom(this.translate.get('MENU.ADMIN'));
      const personsLabel = await firstValueFrom(this.translate.get('MENU.ADMIN_PERSONS'));
      items.push({
        label: adminGroupLabel,
        icon: 'pi pi-shield',
        items: [
          { label: personsLabel, icon: 'pi pi-users', command: () => this.router.navigate(['/admin/persons']) }
        ]
      });
    }

    items.push({
      label: labels['MENU.LOGOUT'],
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    });

    this._avatarMenuItems.set(items);
  }


  async signupWithGoogleMenu() {
    try {
      await this.signupService.signupWithGoogle();
      // Redirigez ou affichez un message si besoin
    } catch (err) {
      // Gérez l'erreur (affichage, log, etc.)
      console.error(err);
    }
  }

  async logout(): Promise<boolean> {
    try {
      await this.signupService.disconnectUser();
    } catch (err) {
      console.error('Error during disconnect', err);
    }
    return this.router.navigate(['/']);
  }

  private async setLanguageMenuItems() {
    const labels = await firstValueFrom(this.translate.get(['LANGUAGE.EN', 'LANGUAGE.FR']));
    this._languageMenuItems.set([
      {
        label: labels['LANGUAGE.EN'],
        icon: 'assets/flags/en.svg',
        command: () => this.setLanguage('en')
      },
      {
        label: labels['LANGUAGE.FR'],
        icon: 'assets/flags/fr.svg',
        command: () => this.setLanguage('fr')
      }
    ]);
  }

  private async setAdminMenuItems() {
    const p = this.person();
    if (p && p.isPlatformAdmin) {
      const personsLabel = await firstValueFrom(this.translate.get('MENU.ADMIN_PERSONS'));
      this._adminMenuItems.set([
        { label: personsLabel, icon: 'pi pi-users', command: () => this.router.navigate(['/admin/persons']) }
      ]);
    } else {
      this._adminMenuItems.set([]);
    }
  }

  private async refreshMenuLabels() {
    await Promise.all([this.setMenuItems(), this.setLanguageMenuItems()]);
  }

  private setLanguage(lang: 'en' | 'fr') {
    this.translate.use(lang);
    this._currentLang.set(lang);
  }
}
