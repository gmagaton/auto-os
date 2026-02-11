import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'telefone',
  standalone: true,
})
export class TelefonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Format based on length
    if (digits.length === 11) {
      // Mobile: (99) 99999-9999
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      // Landline: (99) 9999-9999
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return value;
  }
}

@Pipe({
  name: 'cpf',
  standalone: true,
})
export class CpfPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    if (digits.length === 11) {
      // CPF: 999.999.999-99
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    } else if (digits.length === 14) {
      // CNPJ: 99.999.999/9999-99
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }

    return value;
  }
}

@Pipe({
  name: 'placa',
  standalone: true,
})
export class PlacaPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Remove spaces and special chars, keep alphanumeric
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (clean.length === 7) {
      // Mercosul or old format: ABC-1234 or ABC1D23
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }

    return value.toUpperCase();
  }
}
