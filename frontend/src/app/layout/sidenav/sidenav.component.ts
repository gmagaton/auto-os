import { Component, output, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidenav.component.html',
})
export class SidenavComponent {
  itemClicked = output<void>();

  private tenantService = inject(TenantService);

  menuItems = computed(() => {
    const slug = this.tenantService.slug();
    return [
      { icon: 'dashboard', label: 'Dashboard', route: `/${slug}/dashboard` },
      { label: 'Ordens de Servico', icon: 'build', route: `/${slug}/ordens` },
      { label: 'Agenda', icon: 'calendar_today', route: `/${slug}/agenda` },
      { label: 'Clientes', icon: 'people', route: `/${slug}/clientes` },
      { label: 'Veiculos', icon: 'directions_car', route: `/${slug}/veiculos` },
      { label: 'Servicos', icon: 'handyman', route: `/${slug}/servicos` },
      { label: 'Fabricantes', icon: 'factory', route: `/${slug}/fabricantes` },
      { label: 'Checklist', icon: 'checklist', route: `/${slug}/checklist`, adminOnly: true },
      { label: 'Usuarios', icon: 'admin_panel_settings', route: `/${slug}/usuarios`, adminOnly: true },
    ];
  });

  constructor(public authService: AuthService) {}

  onItemClick(): void {
    this.itemClicked.emit();
  }
}
