import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AsyncPipe } from '@angular/common';
import { Observable, startWith, switchMap, debounceTime, of } from 'rxjs';
import { OrdensService, Ordem } from './ordens.service';
import { VeiculosService, Veiculo } from '../veiculos/veiculos.service';
import { ServicosService, Servico } from '../servicos/servicos.service';

interface ItemForm {
  servicoId: string;
  servicoNome: string;
  servicoTipo: string;
  valor: number;
}

@Component({
  selector: 'app-ordem-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    CurrencyPipe,
    AsyncPipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './ordem-form.component.html',
})
export class OrdemFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordensService = inject(OrdensService);
  private readonly veiculosService = inject(VeiculosService);
  private readonly servicosService = inject(ServicosService);
  private readonly snackBar = inject(MatSnackBar);

  // Stepper
  currentStep = signal(0);

  // State
  loading = signal(false);
  loadingData = signal(true);
  error = signal('');
  ordemAtual = signal<Ordem | null>(null);

  servicosDisponiveis = signal<Servico[]>([]);
  veiculoSelecionado = signal<Veiculo | null>(null);
  itensOrcamento = signal<ItemForm[]>([]);
  filteredVeiculos$!: Observable<Veiculo[]>;

  // Search controls
  veiculoInputControl = new FormControl('');
  servicoSearch = signal('');

  isEdit = false;
  ordemId: string | null = null;

  form: FormGroup;

  valorTotal = computed(() => {
    return this.itensOrcamento().reduce((sum, item) => sum + item.valor, 0);
  });

  ordemNumero = computed(() => {
    const ordem = this.ordemAtual();
    return ordem ? ordem.token.slice(-6).toUpperCase() : '';
  });

  servicosFiltrados = computed(() => {
    const search = this.servicoSearch().toLowerCase().trim();
    if (!search) {
      return this.servicosDisponiveis();
    }
    return this.servicosDisponiveis().filter(
      (s) => s.nome.toLowerCase().includes(search) || s.tipo.toLowerCase().includes(search)
    );
  });

  constructor() {
    this.form = this.fb.group({
      veiculoId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.ordemId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.ordemId;

    // Setup vehicle autocomplete
    this.filteredVeiculos$ = this.veiculoInputControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        const searchTerm = typeof value === 'string' ? value : '';
        if (searchTerm.length < 2) {
          return of([]);
        }
        return this.veiculosService.getAll({ busca: searchTerm });
      })
    );

    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.servicosService.getAll().subscribe({
      next: (servicos) => {
        this.servicosDisponiveis.set(servicos.filter((s) => s.ativo));

        if (this.isEdit && this.ordemId) {
          this.loadOrdem();
        } else {
          this.loadingData.set(false);
        }
      },
      error: () => {
        this.snackBar.open('Erro ao carregar servicos', 'Fechar', { duration: 3000 });
        this.loadingData.set(false);
      },
    });
  }

  private loadOrdem(): void {
    this.ordensService.getById(this.ordemId!).subscribe({
      next: (ordem) => {
        if (ordem.status !== 'AGUARDANDO') {
          this.snackBar.open('Apenas ordens aguardando aprovacao podem ser editadas', 'Fechar', { duration: 3000 });
          this.router.navigate(['/ordens', ordem.id]);
          return;
        }

        this.ordemAtual.set(ordem);
        this.veiculoSelecionado.set(ordem.veiculo as unknown as Veiculo);
        this.form.patchValue({ veiculoId: ordem.veiculo.id });

        const itens: ItemForm[] = ordem.itens.map((item) => ({
          servicoId: item.servico.id,
          servicoNome: item.servico.nome,
          servicoTipo: item.servico.tipo,
          valor: Number(item.valor),
        }));
        this.itensOrcamento.set(itens);

        // Go to step 2 (resumo) when editing
        this.currentStep.set(2);
        this.loadingData.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao carregar ordem', 'Fechar', { duration: 3000 });
        this.router.navigate(['/ordens']);
      },
    });
  }

  // Stepper navigation
  nextStep(): void {
    if (this.canProceed()) {
      this.currentStep.update((s) => Math.min(s + 1, 2));
    }
  }

  previousStep(): void {
    this.currentStep.update((s) => Math.max(s - 1, 0));
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 0:
        return !!this.veiculoSelecionado();
      case 1:
        return this.itensOrcamento().length > 0;
      default:
        return true;
    }
  }

  // Vehicle methods
  displayVeiculo(veiculo: Veiculo | null): string {
    if (!veiculo) return '';
    return veiculo.placa;
  }

  onVeiculoSelected(event: { option: { value: Veiculo } }): void {
    const veiculo = event.option.value;
    this.veiculoSelecionado.set(veiculo);
    this.form.patchValue({ veiculoId: veiculo.id });
  }

  clearVeiculo(): void {
    this.veiculoSelecionado.set(null);
    this.form.patchValue({ veiculoId: '' });
    this.veiculoInputControl.setValue('');
  }

  // Service methods
  isServicoAdded(servicoId: string): boolean {
    return this.itensOrcamento().some((i) => i.servicoId === servicoId);
  }

  toggleServico(servico: Servico): void {
    if (this.isServicoAdded(servico.id)) {
      const itens = this.itensOrcamento().filter((i) => i.servicoId !== servico.id);
      this.itensOrcamento.set(itens);
    } else {
      const itens = [...this.itensOrcamento()];
      itens.push({
        servicoId: servico.id,
        servicoNome: servico.nome,
        servicoTipo: servico.tipo,
        valor: Number(servico.valor),
      });
      this.itensOrcamento.set(itens);
    }
  }

  removeItem(index: number): void {
    const itens = [...this.itensOrcamento()];
    itens.splice(index, 1);
    this.itensOrcamento.set(itens);
  }

  updateValor(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = parseFloat(input.value) || 0;
    const itens = [...this.itensOrcamento()];
    itens[index] = { ...itens[index], valor };
    this.itensOrcamento.set(itens);
  }

  canSave(): boolean {
    return !!this.form.get('veiculoId')?.value && this.itensOrcamento().length > 0;
  }

  save(): void {
    if (!this.canSave()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const payload = {
      veiculoId: this.form.get('veiculoId')?.value,
      itens: this.itensOrcamento().map((item) => ({
        servicoId: item.servicoId,
        valor: item.valor,
      })),
    };

    const request$ = this.isEdit
      ? this.ordensService.update(this.ordemId!, payload)
      : this.ordensService.create(payload);

    request$.subscribe({
      next: (ordem) => {
        this.snackBar.open(
          this.isEdit ? 'Ordem atualizada com sucesso' : 'Ordem criada com sucesso',
          'Fechar',
          { duration: 3000 }
        );
        this.router.navigate(['/ordens', ordem.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao salvar ordem');
      },
    });
  }
}
