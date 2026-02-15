import { Component, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrdensService, Ordem } from '../ordens/ordens.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    FullCalendarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './agenda.component.html',
})
export class AgendaComponent implements AfterViewInit {
  private readonly ordensService = inject(OrdensService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tenantService = inject(TenantService);

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  loading = signal(false);
  eventos = signal<EventInput[]>([]);

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: ptBrLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek',
    },
    events: [],
    eventClick: this.onEventClick.bind(this),
    datesSet: this.onDatesSet.bind(this),
    height: 'auto',
    eventDisplay: 'block',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
    },
  };

  ngAfterViewInit(): void {
    // Initial load will be triggered by datesSet
  }

  onDatesSet(arg: any): void {
    const inicio = arg.start.toISOString().split('T')[0];
    const fim = arg.end.toISOString().split('T')[0];
    this.loadEventos(inicio, fim);
  }

  loadEventos(inicio: string, fim: string): void {
    this.loading.set(true);
    this.ordensService.getByPeriodo(inicio, fim).subscribe({
      next: (ordens) => {
        const eventos: EventInput[] = ordens.map((ordem) => ({
          id: ordem.id,
          title: `${ordem.veiculo.placa} - ${ordem.veiculo.cliente.nome}`,
          start: ordem.dataAgendada,
          backgroundColor: this.getStatusColor(ordem.status),
          borderColor: this.getStatusColor(ordem.status),
          extendedProps: { ordem },
        }));

        this.eventos.set(eventos);
        this.calendarOptions = { ...this.calendarOptions, events: eventos };
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar agenda', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      AGENDADO: '#7b1fa2', // Purple
      EM_ANDAMENTO: '#2e7d32', // Green
    };
    return colors[status] || '#1976d2';
  }

  onEventClick(info: EventClickArg): void {
    const ordem = info.event.extendedProps['ordem'] as Ordem;
    this.router.navigate([this.tenantService.route('/ordens'), ordem.id]);
  }
}
