

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ButtonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent {
  readonly form: FormGroup;
  readonly submitted = signal(false);

  private readonly auth = inject(Auth);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]]
    });
  }

  onSubmit() {
    this.submitted.set(true);
    if (this.form.valid) {
      // TODO: call signup service
      // console.log(this.form.value);
    }
  }

  async onGoogleSignup() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      // TODO: handle post-signup (redirect, message, etc.)
    } catch (err) {
      // TODO: handle error (show message)
      console.error(err);
    }
  }
}
