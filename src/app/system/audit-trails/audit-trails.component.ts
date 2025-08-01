/** Angular Imports */
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UntypedFormControl, ReactiveFormsModule } from '@angular/forms';

/** Custom Data Source */
import { AuditTrailsDataSource } from './audit-trail.datasource';

/** Custom Services */
import { SystemService } from '../system.service';
import { SettingsService } from 'app/settings/settings.service';

/** rxjs Imports */
import { merge } from 'rxjs';
import { tap, debounceTime, distinctUntilChanged, startWith, map } from 'rxjs/operators';
import { Dates } from 'app/core/utils/dates';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { MatOption, MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { MatProgressBar } from '@angular/material/progress-bar';
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
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Audit Trails Component.
 */
@Component({
  selector: 'mifosx-audit-trails',
  templateUrl: './audit-trails.component.html',
  styleUrls: ['./audit-trails.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatProgressBar,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    AsyncPipe,
    DateFormatPipe
  ]
})
export class AuditTrailsComponent implements OnInit, AfterViewInit {
  /** Minimum date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum date allowed. */
  maxDate = new Date();
  /** Audit Trails Data */
  auditTrailsData: any;
  /** Filtered user data for autocomplete. */
  filteredUserData: any;
  /** Filtered action data for autocomplete. */
  filteredActionData: any;
  /** Filtered entity data for autocomplete. */
  filteredEntityData: any;
  /** Filtered checker data for autocomplete. */
  filteredCheckerData: any;
  /** Audit Trail Search Template Data. */
  auditTrailSearchTemplateData: any;
  /** Columns to be displayed in audit trails table. */
  displayedColumns: string[] = [
    'id',
    'resourceId',
    'processingResult',
    'maker',
    'actionName',
    'entityName',
    'officeName',
    'madeOnDate',
    'checker',
    'checkedOnDate'
  ];
  /** Data source for audit trails table. */
  dataSource: AuditTrailsDataSource;
  /** Audit Trails filter. */
  filterAuditTrailsBy = [
    {
      type: 'actionName',
      value: ''
    },
    {
      type: 'entityName',
      value: ''
    },
    {
      type: 'resourceId',
      value: ''
    },
    {
      type: 'makerId',
      value: ''
    },
    {
      type: 'makerDateTimeFrom',
      value: ''
    },
    {
      type: 'makerDateTimeTo',
      value: ''
    },
    {
      type: 'checkerDateTimeFrom',
      value: ''
    },
    {
      type: 'checkerDateTimeTo',
      value: ''
    },
    {
      type: 'checkerId',
      value: ''
    },
    {
      type: 'processingResult',
      value: ''
    },
    {
      type: 'dateFormat',
      value: this.settingsService.dateFormat
    },
    {
      type: 'locale',
      value: this.settingsService.language.code
    }
  ];
  /** User form control. */
  user = new UntypedFormControl('');
  /** From date form control. */
  fromDate = new UntypedFormControl();
  /** Checked from date form control. */
  checkedFromDate = new UntypedFormControl();
  /** Processing result form control. */
  processingResult = new UntypedFormControl();
  /** Action name form control. */
  actionName = new UntypedFormControl();
  /** Resource ID form control. */
  resourceId = new UntypedFormControl('');
  /** To date form control. */
  toDate = new UntypedFormControl();
  /** Checked to date form control. */
  checkedToDate = new UntypedFormControl();
  /** Entity name form control. */
  entityName = new UntypedFormControl();
  /** Checker form control. */
  checker = new UntypedFormControl();

  isLoading = false;

  /** Paginator for audit trails table. */
  @ViewChild(MatPaginator) paginator: MatPaginator;
  /** Sorter for audit trails table. */
  @ViewChild(MatSort) sort: MatSort;

  /**
   * Retrieves the audit trail search template data from `resolve`.
   * @param {ActivatedRoute} route Activated Route.
   * @param {SystemService} systemService System Service.
   * @param {Dates} dateUtils Dates utils
   * @param {SettingsService} settingsService Settings Service
   */
  constructor(
    private route: ActivatedRoute,
    private systemService: SystemService,
    private dateUtils: Dates,
    private settingsService: SettingsService
  ) {
    this.route.data.subscribe((data: { auditTrailSearchTemplate: any }) => {
      this.auditTrailSearchTemplateData = data.auditTrailSearchTemplate;
    });
  }

  /**
   * Sets filtered users, actions and entities for autocomplete and audit trails table.
   */
  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.setFilteredUsers();
    this.setFilteredActions();
    this.setFilteredEntities();
    this.setFilteredCheckers();
    this.dataSource = new AuditTrailsDataSource(this.systemService);
    this.getAuditTrails();
  }

  /**
   * Subscribes to all search filters:
   * User Name, From Date, To Date, Checked From Date, Checked To Date, Resource ID, Action Name, Entity Name, Checker
   * sort change and page change.
   */
  ngAfterViewInit() {
    this.user.valueChanges
      .pipe(
        map((value) => (value.id ? value.id : '')),
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(filterValue, 'makerId');
        })
      )
      .subscribe();

    this.fromDate.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(this.getDate(filterValue), 'makerDateTimeFrom');
        })
      )
      .subscribe();

    this.toDate.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(this.getDate(filterValue), 'makerDateTimeTo');
        })
      )
      .subscribe();

    this.checkedFromDate.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(this.getDate(filterValue), 'checkerDateTimeFrom');
        })
      )
      .subscribe();

    this.checkedToDate.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(this.getDate(filterValue), 'checkerDateTimeTo');
        })
      )
      .subscribe();

    this.resourceId.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(filterValue, 'resourceId');
        })
      )
      .subscribe();

    this.actionName.valueChanges
      .pipe(
        map((value) => (value ? value : '')),
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(filterValue, 'actionName');
        })
      )
      .subscribe();

    this.entityName.valueChanges
      .pipe(
        map((value) => (value ? value : '')),
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(filterValue, 'entityName');
        })
      )
      .subscribe();

    this.checker.valueChanges
      .pipe(
        map((value) => (value ? value : '')),
        debounceTime(500),
        distinctUntilChanged(),
        tap((filterValue) => {
          this.applyFilter(filterValue, 'checkerId');
        })
      )
      .subscribe();

    //this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(tap(() => this.loadAuditTrailsPage()))
      .subscribe();
  }

  /**
   * Initializes the data source for audit trails table and loads the first page.
   */
  getAuditTrails() {
    this.isLoading = true;
    const isActive: string = this.sort ? this.sort.active : '';
    const direction: string = this.sort ? this.sort.direction : '';
    const pageIndex: number = this.paginator ? this.paginator.pageIndex : 0;
    const pageSize: any = this.paginator ? this.paginator.pageSize : 20;

    this.dataSource.getAuditTrails(this.filterAuditTrailsBy, isActive, direction, pageIndex, pageSize);
    this.isLoading = false;
  }

  /**
   * Loads a page of audit trails.
   */
  loadAuditTrailsPage() {
    if (!this.sort.direction) {
      delete this.sort.active;
    }
    this.getAuditTrails();
  }

  /**
   * Filters data in audit trails table based on passed value and poperty.
   * @param {string} filterValue Value to filter data.
   * @param {string} property Property to filter data by.
   */
  applyFilter(filterValue: string, property: string) {
    this.paginator.pageIndex = 0;
    const findIndex = this.filterAuditTrailsBy.findIndex((filter) => filter.type === property);
    this.filterAuditTrailsBy[findIndex].value = filterValue;
    this.loadAuditTrailsPage();
  }

  /**
   * Displays user name in form control input.
   * @param {any} user User data.
   * @returns {string} User name if valid otherwise undefined.
   */
  displayUserName(user?: any): string | undefined {
    return user ? user.name : undefined;
  }

  /**
   * Displays action name in form control input.
   * @param {any} action Action data.
   * @returns {string} Action name if valid otherwise undefined.
   */
  displayActionName(action?: any): string | undefined {
    return action ? action : undefined;
  }

  /**
   * Displays entity name in form control input.
   * @param {any} entity Entity data.
   * @returns {string} Entity name if valid otherwise undefined.
   */
  displayEntityName(entity?: any): string | undefined {
    return entity ? entity : undefined;
  }

  /**
   * Sets filtered users for autocomplete.
   */
  setFilteredUsers() {
    this.filteredUserData = this.user.valueChanges.pipe(
      startWith(''),
      map((user: any) => (typeof user === 'string' ? user : user.name)),
      map((userName: string) =>
        userName ? this.filterUserAutocompleteData(userName) : this.auditTrailSearchTemplateData.appUsers
      )
    );
  }

  /**
   * Sets filtered checkers for autocomplete.
   */
  setFilteredCheckers() {
    this.filteredCheckerData = this.checker.valueChanges.pipe(
      startWith(''),
      map((user: any) => (typeof user === 'string' ? user : user.name)),
      map((userName: string) =>
        userName ? this.filterUserAutocompleteData(userName) : this.auditTrailSearchTemplateData.appUsers
      )
    );
  }

  /**
   * Sets filtered actions for autocomplete.
   */
  setFilteredActions() {
    this.filteredActionData = this.actionName.valueChanges.pipe(
      startWith(''),
      map((action: any) => (typeof action === 'string' ? action : '')),
      map((actionName: string) =>
        actionName ? this.filterActionAutocompleteData(actionName) : this.auditTrailSearchTemplateData.actionNames
      )
    );
  }

  /**
   * Sets filtered entities for autocomplete.
   */
  setFilteredEntities() {
    this.filteredEntityData = this.entityName.valueChanges.pipe(
      startWith(''),
      map((entity: any) => (typeof entity === 'string' ? entity : '')),
      map((entityName: string) =>
        entityName ? this.filterEntityAutocompleteData(entityName) : this.auditTrailSearchTemplateData.entityNames
      )
    );
  }

  /**
   * Filters users.
   * @param {string} userName User name to filter user by.
   * @returns {any} Filtered users.
   */
  private filterUserAutocompleteData(userName: string): any {
    return this.auditTrailSearchTemplateData.appUsers.filter((user: any) =>
      user.username.toLowerCase().includes(userName.toLowerCase())
    );
  }

  /**
   * Filters actions.
   * @param {string} actionName Action name to filter action by.
   * @returns {any} Filtered actions.
   */
  private filterActionAutocompleteData(actionName: string): any {
    return this.auditTrailSearchTemplateData.actionNames.filter((action: any) =>
      action.toLowerCase().includes(actionName.toLowerCase())
    );
  }

  /**
   * Filters entities.
   * @param {string} entityName Entity name to filter action by.
   * @returns {any} Filtered entities.
   */
  private filterEntityAutocompleteData(entityName: string): any {
    return this.auditTrailSearchTemplateData.entityNames.filter((entity: any) =>
      entity.toLowerCase().includes(entityName.toLowerCase())
    );
  }

  /**
   * Generates the CSV file of Audit Trails Data.
   */
  downloadCSV() {
    const dateFormat = this.settingsService.dateFormat;
    const replacer = (key: any, value: any) => (value === undefined ? '' : value);
    const header = [
      'ID',
      'Resource ID',
      'Status',
      'Office',
      'Made On',
      'Maker',
      'Checked On',
      'Checker',
      'Entity',
      'Action',
      'Client'
    ];
    const headerCode = [
      'id',
      'resourceId',
      'processingResult',
      'officeName',
      'madeOnDate',
      'maker',
      'checkedOnDate',
      'checker',
      'entityName',
      'actionName',
      'clientName'
    ];
    this.systemService
      .getAuditTrails(this.filterAuditTrailsBy, this.sort.active ? this.sort.active : '', this.sort.direction, 0, -1)
      .subscribe((response: any) => {
        if (response !== undefined) {
          let csv = response.pageItems.map((row: any) =>
            headerCode.map((fieldName) =>
              (fieldName === 'madeOnDate' || fieldName === 'checkedOnDate') &&
              JSON.stringify(row[fieldName], replacer) !== '""'
                ? this.dateUtils.formatDate(JSON.stringify(row[fieldName], replacer), dateFormat)
                : JSON.stringify(row[fieldName], replacer)
            )
          );
          csv.unshift(`data:text/csv;charset=utf-8,${header.join()}`);
          csv = csv.join('\r\n');
          const link = document.createElement('a');
          link.setAttribute('href', encodeURI(csv));
          link.setAttribute('download', 'Audit Trails.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
  }

  /**
   * Gets the date from the passed timestamp.
   *
   * TODO: Update once language and date settings are setup.
   *
   * @param {any} timestamp Timestamp from which date is to be extracted.
   */
  private getDate(timestamp: any) {
    const dateFormat = this.settingsService.dateFormat;
    return this.dateUtils.formatDate(timestamp, dateFormat);
  }
}
