import { Component, ViewChild, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HeaderComponent } from './header/header.component';
import { SidenavComponent } from './sidenav/sidenav.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, HeaderComponent, SidenavComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = signal(false);

  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.sidenav.close();
    }
  }
}
