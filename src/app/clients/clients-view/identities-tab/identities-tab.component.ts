/** Angular Imports */
import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';

/** Custom Models */
import { FormfieldBase } from 'app/shared/form-dialog/formfield/model/formfield-base';
import { InputBase } from 'app/shared/form-dialog/formfield/model/input-base';
import { SelectBase } from 'app/shared/form-dialog/formfield/model/select-base';

/** Custom Components */
import { FormDialogComponent } from 'app/shared/form-dialog/form-dialog.component';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { UploadDocumentDialogComponent } from '../custom-dialogs/upload-document-dialog/upload-document-dialog.component';

/** Custom Services */
import { TranslateService } from '@ngx-translate/core';
import { ClientsService } from '../../clients.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgStyle, NgFor } from '@angular/common';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Identities Tab Component
 */
@Component({
  selector: 'mifosx-identities-tab',
  templateUrl: './identities-tab.component.html',
  styleUrls: ['./identities-tab.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    MatTable,
    NgStyle,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow
  ]
})
export class IdentitiesTabComponent {
  /** Client Identities */
  clientIdentities: any;
  /** Client Identifier Template */
  clientIdentifierTemplate: any;
  /** Client Id */
  clientId: string;
  /** Identities Columns */
  identitiesColumns: string[] = [
    'id',
    'description',
    'type',
    'documentKey',
    'documents',
    'status',
    'actions'
  ];

  /** Identifiers Table */
  @ViewChild('identifiersTable', { static: true }) identifiersTable: MatTable<Element>;

  /**
   * @param {ActivatedRoute} route Activated Route
   * @param {MatDialog} dialog Mat Dialog
   * @param {ClientsService} clientService Clients Service
   */
  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private clientService: ClientsService,
    private translateService: TranslateService
  ) {
    this.clientId = this.route.parent.snapshot.paramMap.get('clientId');
    this.route.data.subscribe((data: { clientIdentities: any; clientIdentifierTemplate: any }) => {
      this.clientIdentities = data.clientIdentities;
      this.clientIdentifierTemplate = data.clientIdentifierTemplate;
    });
  }

  /**
   * Download Client Document
   * @param {string} parentEntityId Parent Entity Id
   * @param {string} documentId Document ID
   */
  download(parentEntityId: string, documentId: string) {
    this.clientService.downloadClientIdentificationDocument(parentEntityId, documentId).subscribe((res) => {
      const url = window.URL.createObjectURL(res);
      window.open(url);
    });
  }

  /**
   * Add Client Identifier
   */
  addIdentifier() {
    for (let index = 0; index < this.clientIdentifierTemplate.allowedDocumentTypes.length; index++) {
      this.clientIdentifierTemplate.allowedDocumentTypes[index].name = this.translateService.instant(
        `labels.catalogs.${this.clientIdentifierTemplate.allowedDocumentTypes[index].name}`
      );
    }
    const formfields: FormfieldBase[] = [
      new SelectBase({
        controlName: 'documentTypeId',
        label: this.translateService.instant('labels.inputs.Document Type'),
        value: '',
        options: { label: 'name', value: 'id', data: this.clientIdentifierTemplate.allowedDocumentTypes },
        required: true,
        order: 1
      }),
      new SelectBase({
        controlName: 'status',
        label: this.translateService.instant('labels.inputs.Status'),
        value: '2',
        options: {
          label: 'label',
          value: 'value',
          data: [
            { label: this.translateService.instant('labels.catalogs.Active'), value: 'Active' },
            { label: this.translateService.instant('labels.catalogs.Inactive'), value: 'Inactive' }
          ]
        },
        required: true,
        order: 2
      }),
      new InputBase({
        controlName: 'documentKey',
        label: this.translateService.instant('labels.inputs.Document Key'),
        value: '',
        type: 'text',
        required: true,
        order: 3
      }),
      new InputBase({
        controlName: 'description',
        label: this.translateService.instant('labels.inputs.Description'),
        value: '',
        type: 'text',
        order: 4
      })

    ];
    const data = {
      title: this.translateService.instant('labels.heading.Add Client Identifier'),
      formfields: formfields
    };
    const addIdentifierDialogRef = this.dialog.open(FormDialogComponent, { data });
    addIdentifierDialogRef.afterClosed().subscribe((response: any) => {
      if (response.data) {
        this.clientService.addClientIdentifier(this.clientId, response.data.value).subscribe((res: any) => {
          this.clientIdentities.push({
            id: res.resourceId,
            description: response.data.value.description,
            documentType: this.clientIdentifierTemplate.allowedDocumentTypes.filter(
              (doc: any) => doc.id === response.data.value.documentTypeId
            )[0],
            documentKey: response.data.value.documentKey,
            documents: [],
            clientId: this.clientId,
            status:
              response.data.value.status === 'Active'
                ? 'clientIdentifierStatusType.active'
                : 'clientIdentifierStatusType.inactive'
          });
          this.identifiersTable.renderRows();
        });
      }
    });
  }

  /**
   * Delete Client Identifier
   * @param {string} clientId Client Id
   * @param {string} identifierId Identifier Id
   * @param {number} index Index
   */
  deleteIdentifier(clientId: string, identifierId: string, index: number) {
    const deleteIdentifierDialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: `${this.translateService.instant('labels.heading.identifier id')} : ${identifierId}` }
    });
    deleteIdentifierDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.clientService.deleteClientIdentifier(clientId, identifierId).subscribe((res) => {
          this.clientIdentities.splice(index, 1);
          this.identifiersTable.renderRows();
        });
      }
    });
  }

  /**
   * Upload Document
   * @param {number} index Index
   * @param {string} identifierId Identifier Id
   */
  uploadDocument(index: number, identifierId: string) {
    const uploadDocumentDialogRef = this.dialog.open(UploadDocumentDialogComponent, {
      data: { documentIdentifier: true }
    });
    uploadDocumentDialogRef.afterClosed().subscribe((dialogResponse: any) => {
      if (dialogResponse) {
        const formData: FormData = new FormData();
        formData.append('name', dialogResponse.fileName);
        formData.append('file', dialogResponse.file);
        this.clientService.uploadClientIdentifierDocument(identifierId, formData).subscribe((res: any) => {
          this.clientIdentities[index].documents.push({
            id: res.resourceId,
            parentEntityType: 'client_identifiers',
            parentEntityId: identifierId,
            name: dialogResponse.fileName,
            fileName: dialogResponse.file.name
          });
          this.identifiersTable.renderRows();
        });
      }
    });
  }
}
