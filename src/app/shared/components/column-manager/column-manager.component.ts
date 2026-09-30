import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TableColumn } from '../../../core/models';

@Component({
  selector: 'app-column-manager',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  template: `
    <div ngbDropdown>
      <button class="btn btn-sm btn-outline-secondary" ngbDropdownToggle>⊞ Columnas</button>
      <div ngbDropdownMenu class="p-2" style="min-width:220px">
        @for (col of columns(); track col.key) {
          <div class="form-check mb-1">
            <input class="form-check-input" type="checkbox" [id]="'cm_'+col.key"
                   [checked]="col.visible" (change)="toggle(col.key)"/>
            <label class="form-check-label small" [for]="'cm_'+col.key">{{col.label}}</label>
          </div>
        }
      </div>
    </div>
  `
})
export class ColumnManagerComponent {
  columns = input<TableColumn[]>([]);
  toggled = output<string>();
  toggle(key: string) { this.toggled.emit(key); }
}
