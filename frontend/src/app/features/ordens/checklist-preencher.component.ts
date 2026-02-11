import { Component, inject, signal, input, output, computed, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime } from 'rxjs';
import { ChecklistService, StatusChecklist } from '../checklist/checklist.service';

interface ItemForm {
  itemId: string;
  nome: string;
  categoria: string;
  status: StatusChecklist | null;
  observacao: string;
}

@Component({
  selector: 'app-checklist-preencher',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './checklist-preencher.component.html',
})
export class ChecklistPreencherComponent implements OnInit, OnDestroy {
  private readonly checklistService = inject(ChecklistService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly saveSubject = new Subject<void>();
  private hasUnsavedChanges = false;

  ordemId = input.required<string>();
  disabled = input<boolean>(false);
  changed = output<void>();

  itens = signal<ItemForm[]>([]);
  loading = signal(true);
  saving = signal(false);
  currentIndex = signal(0);

  // Computed values
  currentItem = computed(() => this.itens()[this.currentIndex()] || null);
  totalItens = computed(() => this.itens().length);
  preenchidosCount = computed(() => this.itens().filter((i) => i.status !== null).length);
  faltamCount = computed(() => this.totalItens() - this.preenchidosCount());
  progressPercent = computed(() =>
    this.totalItens() > 0 ? (this.preenchidosCount() / this.totalItens()) * 100 : 0
  );
  isComplete = computed(() => this.itens().every((i) => i.status !== null));

  ngOnInit(): void {
    this.loadChecklist();

    // Auto-save debounced (1 second after last change)
    this.saveSubject.pipe(debounceTime(1000)).subscribe(() => {
      if (this.hasUnsavedChanges && !this.disabled()) {
        this.autoSave();
      }
    });
  }

  ngOnDestroy(): void {
    // Save any pending changes before destroying
    if (this.hasUnsavedChanges && !this.disabled()) {
      this.autoSave();
    }
  }

  loadChecklist(): void {
    this.loading.set(true);
    this.checklistService.getByOrdem(this.ordemId()).subscribe({
      next: (data) => {
        const itensForm: ItemForm[] = data.map((d) => ({
          itemId: d.item.id,
          nome: d.item.nome,
          categoria: d.item.categoria,
          status: d.preenchido?.status || null,
          observacao: d.preenchido?.observacao || '',
        }));

        this.itens.set(itensForm);
        this.loading.set(false);

        // Ir para primeiro item não preenchido
        const firstEmpty = itensForm.findIndex((i) => i.status === null);
        if (firstEmpty >= 0) {
          this.currentIndex.set(firstEmpty);
        }
      },
      error: () => {
        this.snackBar.open('Erro ao carregar checklist', 'Fechar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  setStatus(status: StatusChecklist): void {
    if (this.disabled()) return;

    const item = this.currentItem();
    if (!item) return;

    // Atualizar status
    this.itens.update((itens) =>
      itens.map((i) =>
        i.itemId === item.itemId ? { ...i, status } : i
      )
    );

    this.hasUnsavedChanges = true;
    this.saveSubject.next();
    this.changed.emit();

    // Auto-avanço se não for DEFEITO (precisa preencher observação)
    if (status !== 'DEFEITO') {
      setTimeout(() => this.avancar(), 300);
    }
  }

  updateObservacao(observacao: string): void {
    const item = this.currentItem();
    if (!item) return;

    this.itens.update((itens) =>
      itens.map((i) =>
        i.itemId === item.itemId ? { ...i, observacao } : i
      )
    );

    this.hasUnsavedChanges = true;
    this.saveSubject.next();
    this.changed.emit();
  }

  avancar(): void {
    if (this.currentIndex() < this.totalItens() - 1) {
      this.currentIndex.update((i) => i + 1);
      this.cdr.detectChanges();
    }
  }

  voltar(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
      this.cdr.detectChanges();
    }
  }

  marcarTodosOk(): void {
    if (this.disabled()) return;

    this.itens.update((itens) =>
      itens.map((i) => (i.status === null ? { ...i, status: 'OK' as StatusChecklist } : i))
    );

    this.hasUnsavedChanges = true;
    this.saveSubject.next();
    this.changed.emit();

    // Ir para o último item
    this.currentIndex.set(this.totalItens() - 1);
    this.cdr.detectChanges();
  }

  getStatusClass(status: StatusChecklist | null): string {
    switch (status) {
      case 'OK':
        return 'status-ok';
      case 'DEFEITO':
        return 'status-defeito';
      case 'NAO_APLICA':
        return 'status-na';
      default:
        return '';
    }
  }

  // Método para salvar (chamado pelo componente pai)
  getItensPreenchidos() {
    return this.itens()
      .filter((i) => i.status !== null)
      .map((i) => ({
        itemId: i.itemId,
        status: i.status as StatusChecklist,
        observacao: i.observacao || undefined,
      }));
  }

  private autoSave(): void {
    const itensPreenchidos = this.getItensPreenchidos();
    if (itensPreenchidos.length === 0) return;

    this.saving.set(true);
    this.checklistService.preencherChecklist(this.ordemId(), itensPreenchidos).subscribe({
      next: () => {
        this.hasUnsavedChanges = false;
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao salvar checklist', 'Fechar', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  salvar(): void {
    const itensPreenchidos = this.getItensPreenchidos();

    if (itensPreenchidos.length === 0) {
      this.snackBar.open('Preencha pelo menos um item', 'Fechar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    this.checklistService.preencherChecklist(this.ordemId(), itensPreenchidos).subscribe({
      next: () => {
        this.hasUnsavedChanges = false;
        this.snackBar.open('Checklist salvo com sucesso', 'Fechar', { duration: 3000 });
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Erro ao salvar checklist', 'Fechar', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }
}
