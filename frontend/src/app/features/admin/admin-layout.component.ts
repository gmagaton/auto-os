import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      <span>AutoOS Admin</span>
      <span class="spacer"></span>
      <button mat-button (click)="authService.logout()">
        <mat-icon>exit_to_app</mat-icon>
        Sair
      </button>
    </mat-toolbar>
    <div class="admin-content">
      <mat-nav-list class="admin-sidenav">
        <a mat-list-item routerLink="/admin/empresas" routerLinkActive="active">
          <mat-icon matListItemIcon>business</mat-icon>
          <span matListItemTitle>Empresas</span>
        </a>
      </mat-nav-list>
      <div class="admin-main">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    .admin-content { display: flex; height: calc(100vh - 64px); }
    .admin-sidenav { width: 240px; border-right: 1px solid #e0e0e0; }
    .admin-main { flex: 1; padding: 24px; overflow-y: auto; }
  `],
})
export class AdminLayoutComponent {
  constructor(public authService: AuthService) {}
}
