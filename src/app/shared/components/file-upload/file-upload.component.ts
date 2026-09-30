import { Component, signal, output, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (auth.esVisor()) {
      <div class="gd-upload-zone gd-upload-zone--disabled" aria-disabled="true">
        <div class="gd-upload-icon" aria-hidden="true"><i class="fi fi-rr-lock"></i></div>
        <span class="gd-upload-label">Sin documento</span>
        <span class="gd-upload-hint">Solo lectura</span>
      </div>
    } @else {
      <div class="gd-upload-zone" [class.drag-over]="dragging()"
           (dragover)="$event.preventDefault(); dragging.set(true)"
           (dragleave)="dragging.set(false)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()"
           role="button" tabindex="0" [attr.aria-label]="'Subir ' + label()">
        <input #fileInput type="file" class="visually-hidden"
               [accept]="accept()" (change)="onFile($event)"/>
        <div class="gd-upload-icon" aria-hidden="true"><i class="fi fi-rr-cloud-upload"></i></div>
        <span class="gd-upload-label">Subir documento</span>
        <span class="gd-upload-hint">{{ accept() | uppercase }}</span>
        <span class="gd-upload-hint">Máx. 10 MB</span>
      </div>
    }
  `,
  styles: [`
    .gd-upload-zone{border:1.5px dashed #C9D5E3;border-radius:8px;padding:12px 8px;text-align:center;cursor:pointer;background:#F7F9FC;transition:border-color .2s,background .2s;min-width:90px;
      &:hover,.drag-over{border-color:#0B4DB8;background:#EAF1FF;}}
    .gd-upload-zone--disabled{cursor:not-allowed;opacity:.65;
      &:hover{border-color:#C9D5E3;background:#F7F9FC;}}
    .gd-upload-icon{font-size:18px;display:block;color:#0B4DB8;margin-bottom:2px;}
    .gd-upload-label{display:block;font-size:11px;font-weight:600;color:#0B4DB8;}
    .gd-upload-hint{display:block;font-size:9px;color:#7A889B;}
  `]
})
export class FileUploadComponent {
  protected auth = inject(AuthService);
  label   = input('archivo');
  accept  = input('PDF, JPG, PNG');
  dragging = signal(false);
  fileSelected = output<File>();

  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.fileSelected.emit(f);
  }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.dragging.set(false);
    const f = e.dataTransfer?.files[0];
    if (f) this.fileSelected.emit(f);
  }
}
