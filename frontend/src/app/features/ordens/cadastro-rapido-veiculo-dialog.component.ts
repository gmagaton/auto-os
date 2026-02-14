import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Observable, startWith, switchMap, debounceTime, of } from 'rxjs';
import { ClientesService, Cliente } from '../clientes/clientes.service';
import { VeiculosService, Veiculo } from '../veiculos/veiculos.service';
import { FabricantesService, Fabricante, Modelo } from '../fabricantes/fabricantes.service';

@Component({
  selector: 'app-cadastro-rapido-veiculo-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
  templateUrl: './cadastro-rapido-veiculo-dialog.component.html',
})
export class CadastroRapidoVeiculoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CadastroRapidoVeiculoDialogComponent>);
  private readonly data = inject<{ placa: string }>(MAT_DIALOG_DATA);
  private readonly clientesService = inject(ClientesService);
  private readonly veiculosService = inject(VeiculosService);
  private readonly fabricantesService = inject(FabricantesService);
  private readonly snackBar = inject(MatSnackBar);

  placa = '';
  saving = signal(false);

  // Cliente state
  criandoNovoCliente = signal(false);
  clienteSelecionado = signal<Cliente | null>(null);
  clienteInputControl = new FormControl('');
  filteredClientes$!: Observable<Cliente[]>;

  // Veiculo state
  fabricantes = signal<Fabricante[]>([]);
  modelos = signal<Modelo[]>([]);

  // Forms
  clienteForm: FormGroup;
  veiculoForm: FormGroup;

  currentYear = new Date().getFullYear();

  constructor() {
    this.clienteForm = this.fb.group({
      nome: ['', Validators.required],
      telefone: ['', Validators.required],
    });

    this.veiculoForm = this.fb.group({
      cor: ['', Validators.required],
      ano: [null],
      fabricanteId: ['', Validators.required],
      modeloId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.placa = this.data.placa;

    // Setup client autocomplete
    this.filteredClientes$ = this.clienteInputControl.valueChanges.pipe(
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

    // Load fabricantes
    this.fabricantesService.getAll().subscribe({
      next: (fabricantes) => this.fabricantes.set(fabricantes),
      error: () => this.snackBar.open('Erro ao carregar fabricantes', 'Fechar', { duration: 3000 }),
    });
  }

  // Cliente methods
  toggleClienteMode(): void {
    this.criandoNovoCliente.update((v) => !v);
    this.clienteSelecionado.set(null);
    this.clienteInputControl.setValue('');
    this.clienteForm.reset();
  }

  displayCliente(cliente: Cliente | null): string {
    return cliente?.nome ?? '';
  }

  onClienteSelected(event: { option: { value: Cliente } }): void {
    this.clienteSelecionado.set(event.option.value);
  }

  clearCliente(): void {
    this.clienteSelecionado.set(null);
    this.clienteInputControl.setValue('');
  }

  // Fabricante/Modelo
  onFabricanteChange(fabricanteId: string): void {
    this.veiculoForm.patchValue({ modeloId: '' });
    this.modelos.set([]);
    if (fabricanteId) {
      this.fabricantesService.getModelos(fabricanteId).subscribe({
        next: (modelos) => this.modelos.set(modelos),
        error: () => this.modelos.set([]),
      });
    }
  }

  // Validation
  canSave(): boolean {
    const hasCliente = this.criandoNovoCliente() ? this.clienteForm.valid : !!this.clienteSelecionado();
    return hasCliente && this.veiculoForm.valid;
  }

  // Save
  save(): void {
    if (!this.canSave()) {
      this.clienteForm.markAllAsTouched();
      this.veiculoForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    if (this.criandoNovoCliente()) {
      // Create client first, then vehicle
      const clienteData = {
        nome: this.clienteForm.value.nome,
        telefone: this.clienteForm.value.telefone,
      };
      this.clientesService.create(clienteData).subscribe({
        next: (cliente) => this.createVeiculo(cliente.id),
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err.error?.message || 'Erro ao criar cliente', 'Fechar', { duration: 3000 });
        },
      });
    } else {
      this.createVeiculo(this.clienteSelecionado()!.id);
    }
  }

  private createVeiculo(clienteId: string): void {
    const veiculoData = {
      placa: this.placa,
      cor: this.veiculoForm.value.cor,
      ano: this.veiculoForm.value.ano ? Number(this.veiculoForm.value.ano) : undefined,
      modeloId: this.veiculoForm.value.modeloId,
      clienteId,
    };

    this.veiculosService.create(veiculoData).subscribe({
      next: (created) => {
        // Fetch full vehicle with relations
        this.veiculosService.getById(created.id).subscribe({
          next: (veiculo) => {
            this.snackBar.open('Veiculo cadastrado com sucesso', 'Fechar', { duration: 3000 });
            this.dialogRef.close(veiculo);
          },
          error: () => {
            // Even if getById fails, close with the created data
            this.dialogRef.close(created);
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message || 'Erro ao criar veiculo', 'Fechar', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
