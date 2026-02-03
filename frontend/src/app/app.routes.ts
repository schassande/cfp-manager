import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ConferenceViewComponent } from './pages/conference/conference-view/conference-view.component';

import { SignupComponent } from './pages/person/signup/signup.component';
import { LoginComponent } from './pages/person/login/login.component';
import { PreferenceComponent } from './pages/preference/preference.component';
import { PersonListComponent } from './pages/person/list/person-list.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
	{ path: '', component: HomeComponent, pathMatch: 'full' },
	{ path: 'conference/:id', component: ConferenceViewComponent },
	{ path: 'preference', component: PreferenceComponent },
	{ path: 'admin/persons', component: PersonListComponent, canActivate: [AdminGuard] },
	{ path: 'signup', component: SignupComponent },
	{ path: 'login', component: LoginComponent }
];
