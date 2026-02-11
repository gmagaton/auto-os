import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidenav.component.html',
})
export class SidenavComponent {
  itemClicked = output<void>();

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { label: 'Ordens de Servico', icon: 'build', route: '/ordens' },
    { label: 'Agenda', icon: 'calendar_today', route: '/agenda' },
    { label: 'Clientes', icon: 'people', route: '/clientes' },
    { label: 'Veiculos', icon: 'directions_car', route: '/veiculos' },
    { label: 'Servicos', icon: 'handyman', route: '/servicos' },
    { label: 'Fabricantes', icon: 'factory', route: '/fabricantes' },
    { label: 'Checklist', icon: 'checklist', route: '/checklist', adminOnly: true },
    { label: 'Usuarios', icon: 'admin_panel_settings', route: '/usuarios', adminOnly: true },
  ];

  constructor(public authService: AuthService) {}

  onItemClick(): void {
    this.itemClicked.emit();
  }
}
