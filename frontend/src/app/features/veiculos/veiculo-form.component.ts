import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AsyncPipe } from '@angular/common';
import { Observable, map, startWith, switchMap, debounceTime, of } from 'rxjs';
import { VeiculosService } from './veiculos.service';
import { FabricantesService, Fabricante, Modelo } from '../fabricantes/fabricantes.service';
import { ClientesService, Cliente } from '../clientes/clientes.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-veiculo-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule,
    AsyncPipe,
  ],
  templateUrl: './veiculo-form.component.html',
})
export class VeiculoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly veiculosService = inject(VeiculosService);
  private readonly fabricantesService = inject(FabricantesService);
  private readonly clientesService = inject(ClientesService);
  private readonly snackBar = inject(MatSnackBar);
  public readonly tenantService = inject(TenantService);

  loading = signal(false);
  loadingData = signal(true);
  error = signal('');

  fabricantes = signal<Fabricante[]>([]);
  modelos = signal<Modelo[]>([]);
  filteredClientes$!: Observable<Cliente[]>;

  isEdit = false;
  veiculoId: string | null = null;
  currentYear = new Date().getFullYear();

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i)]],
      cor: ['', Validators.required],
      ano: [null],
      fabricanteId: ['', Validators.required],
      modeloId: ['', Validators.required],
      clienteId: ['', Validators.required],
      clienteInput: [''],
    });
  }

  ngOnInit(): void {
    this.veiculoId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.veiculoId;

    // Setup client autocomplete
    this.filteredClientes$ = this.form.get('clienteInput')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        const searchTerm = typeof value === 'string' ? value : '';
        if (searchTerm.length < 2) {
          return of([]);
        }
        return this.clientesService.getAll(searchTerm);
      })
    );

    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Load fabricantes first
    this.fabricantesService.getAll().subscribe({
      next: (fabricantes) => {
        this.fabricantes.set(fabricantes);

        if (this.isEdit && this.veiculoId) {
          this.loadVeiculo();
        } else {
          // Check for clienteId query param
          const clienteId = this.route.snapshot.queryParamMap.get('clienteId');
          if (clienteId) {
            this.loadClienteById(clienteId);
          }
          this.loadingData.set(false);
        }
      },
      error: () => {
        this.snackBar.open('Erro ao carregar fabricantes', 'Fechar', { duration: 3000 });
        this.loadingData.set(false);
      },
    });
  }

  private loadVeiculo(): void {
    this.veiculosService.getById(this.veiculoId!).subscribe({
      next: (veiculo) => {
        // Extract clienteId - prefer direct field, fallback to nested object
        const clienteId = veiculo.clienteId || veiculo.cliente?.id;

        // Set fabricanteId first and load modelos
        const fabricanteId = veiculo.modelo?.fabricante?.id;
        if (fabricanteId) {
          this.form.patchValue({ fabricanteId });
          this.loadModelos(fabricanteId, () => {
            // Set all form values after modelos are loaded
            this.form.patchValue({
              placa: veiculo.placa?.replace(/[^A-Z0-9]/gi, '').toUpperCase(),
              cor: veiculo.cor,
              ano: veiculo.ano,
              modeloId: veiculo.modeloId || veiculo.modelo?.id,
              clienteId: clienteId,
              clienteInput: veiculo.cliente,
            });
            this.finalizeFormLoad();
          });
        } else {
          this.form.patchValue({
            placa: veiculo.placa?.replace(/[^A-Z0-9]/gi, '').toUpperCase(),
            cor: veiculo.cor,
            ano: veiculo.ano,
            clienteId: clienteId,
            clienteInput: veiculo.cliente,
          });
          this.finalizeFormLoad();
        }
      },
      error: () => {
        this.snackBar.open('Erro ao carregar veiculo', 'Fechar', { duration: 3000 });
        this.router.navigate([this.tenantService.route('/veiculos')]);
      },
    });
  }

  private finalizeFormLoad(): void {
    // Force Angular to detect changes
    setTimeout(() => {
      this.form.updateValueAndValidity();
      this.form.markAsPristine();
      this.loadingData.set(false);
    }, 0);
  }

  private loadClienteById(clienteId: string): void {
    this.clientesService.getById(clienteId).subscribe({
      next: (cliente) => {
        this.form.patchValue({
          clienteId: cliente.id,
          clienteInput: cliente,
        });
      },
      error: () => {
        // Silently fail, user can still select client manually
      },
    });
  }

  onFabricanteChange(fabricanteId: string): void {
    this.form.patchValue({ modeloId: '' });
    this.loadModelos(fabricanteId);
  }

  private loadModelos(fabricanteId: string, callback?: () => void): void {
    this.fabricantesService.getModelos(fabricanteId).subscribe({
      next: (modelos) => {
        this.modelos.set(modelos);
        if (callback) callback();
      },
      error: () => {
        this.modelos.set([]);
        if (callback) callback();
      },
    });
  }

  displayCliente(cliente: Cliente | null): string {
    return cliente?.nome ?? '';
  }

  onClienteSelected(event: { option: { value: Cliente } }): void {
    const cliente = event.option.value;
    this.form.patchValue({ clienteId: cliente.id });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const formValue = this.form.value;
    const payload = {
      placa: formValue.placa.toUpperCase(),
      cor: formValue.cor,
      ano: formValue.ano ? Number(formValue.ano) : undefined,
      modeloId: formValue.modeloId,
      clienteId: formValue.clienteId,
    };

    const request$ = this.isEdit
      ? this.veiculosService.update(this.veiculoId!, payload)
      : this.veiculosService.create(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Veiculo atualizado com sucesso' : 'Veiculo criado com sucesso',
          'Fechar',
          { duration: 3000 }
        );
        this.router.navigate([this.tenantService.route('/veiculos')]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao salvar veiculo');
      },
    });
  }
}
