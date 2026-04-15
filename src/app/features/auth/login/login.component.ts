import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzInputModule,
    NzButtonModule,
    NzFormModule,
    NzCheckboxModule,
    NzIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [NzMessageService]
})
export class LoginComponent {
  loginForm: FormGroup;
  passwordVisible = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService,
    private message: NzMessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      remember: [false],
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      const success = this.authService.login(email, password);
      
      if (success) {
        this.message.success('Welcome to La Media Luna!');
      } else {
        this.message.error('Invalid credentials. Please try again.');
      }
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
