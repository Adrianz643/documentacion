import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  private san = inject(DomSanitizer);
  transform(url: string) { return this.san.bypassSecurityTrustResourceUrl(url); }
}
