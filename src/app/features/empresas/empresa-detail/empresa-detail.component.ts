import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({ selector:'app-empresa-detail', standalone:true, imports:[CommonModule,RouterLink],
  template:`<div class="p-4">
  <h1 class="gd-page-title">Detalle de empresa</h1>
  <div class="gd-doc-grid mt-3">
    <a routerLink="/empresas/1/documentos/personales" class="gd-doc-card">
      <span class="gd-doc-icon"><i class="fi fi-rr-document"></i></span>
      <span class="gd-doc-label">Documentos Personales</span>
      <span class="gd-doc-arrow" aria-hidden="true"></span>
    </a>
    <a routerLink="/empresas/1/documentos/fiel" class="gd-doc-card">
      <span class="gd-doc-icon"><i class="fi fi-rr-lock"></i></span>
      <span class="gd-doc-label">FIEL</span>
      <span class="gd-doc-arrow" aria-hidden="true"></span>
    </a>
    <a routerLink="/empresas/1/documentos/declaraciones" class="gd-doc-card">
      <span class="gd-doc-icon"><i class="fi fi-rr-calendar"></i></span>
      <span class="gd-doc-label">Declaraciones</span>
      <span class="gd-doc-arrow" aria-hidden="true"></span>
    </a>
    <a routerLink="/empresas/1/documentos/facturas" class="gd-doc-card">
      <span class="gd-doc-icon"><i class="fi fi-rr-receipt"></i></span>
      <span class="gd-doc-label">Facturas</span>
      <span class="gd-doc-arrow" aria-hidden="true"></span>
    </a>
  </div>
</div>`,
  styles:[`
    .gd-page-title{font-size:22px;font-weight:700;color:#172B4D;}
    .gd-doc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
    @media (max-width:700px){.gd-doc-grid{grid-template-columns:1fr;}}
    .gd-doc-card{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #DDE5EF;border-radius:12px;padding:28px;text-decoration:none;transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease;}
    .gd-doc-card:hover{border-color:#0B4DB8;box-shadow:0 4px 14px rgba(11,77,184,.12);transform:translateY(-2px);}
    .gd-doc-icon{display:flex;align-items:center;justify-content:center;width:56px;height:56px;flex-shrink:0;border-radius:12px;background:rgba(11,77,184,.08);color:#0B4DB8;font-size:24px;}
    .gd-doc-label{flex:1;font-size:17px;font-weight:600;color:#172B4D;}
    .gd-doc-arrow{width:10px;height:10px;border-right:2px solid #B7C0CC;border-top:2px solid #B7C0CC;transform:rotate(45deg);flex-shrink:0;}
    .gd-doc-card:hover .gd-doc-arrow{border-color:#0B4DB8;}
  `] })
export class EmpresaDetailComponent {}
