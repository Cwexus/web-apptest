/** Angular Imports */
import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import {
  UntypedFormGroup,
  Validators,
  UntypedFormBuilder,
  UntypedFormControl,
  ReactiveFormsModule
} from '@angular/forms';

/** Custom Services */
import { ReportsService } from 'app/reports/reports.service';

/** Custom Models */
import { ReportParameter } from 'app/reports/common-models/report-parameter.model';
import { SettingsService } from 'app/settings/settings.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { EditBusinessRuleParametersComponent } from './edit-business-rule-parameters/edit-business-rule-parameters.component';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Edit SMS Campaign step.
 */
@Component({
  selector: 'mifosx-edit-sms-campaign-step',
  templateUrl: './edit-sms-campaign-step.component.html',
  styleUrls: ['./edit-sms-campaign-step.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatCheckbox,
    EditBusinessRuleParametersComponent
  ]
})
export class EditSmsCampaignStepComponent implements OnInit {
  /** SMS Campaign Template */
  @Input() smsCampaignTemplate: any;
  /** SMS Campaign */
  @Input() smsCampaign: any;

  /** SMS Campaign Form */
  smsCampaignDetailsForm: UntypedFormGroup;
  /** Data to be passed to sub component */
  paramData: any;
  /** Trigger types options */
  triggerTypes: any[];
  /** SMS providers options */
  smsProviders: any[];
  /** Business Rules options */
  businessRules: any[];
  /** Repetition Intervals */
  repetitionIntervals: any[];
  /** Minimum Date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum Date allowed. */
  maxDate = new Date();

  /** Template Parameters Event Emitter */
  @Output() templateParameters = new EventEmitter();

  /**
   * @param {FormBuilder} formBuilder Form Builder
   * @param {ReportsService} reportService Reports Service
   * @param {SettingsService} settingsService Settings Service.
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private reportService: ReportsService,
    private settingsService: SettingsService
  ) {
    this.createSMSCampaignDetailsForm();
  }

  /**
   * Initializes the SMS campaign form.
   */
  createSMSCampaignDetailsForm() {
    this.smsCampaignDetailsForm = this.formBuilder.group({
      campaignName: [
        '',
        Validators.required
      ],
      providerId: [null],
      triggerType: [
        '',
        Validators.required
      ],
      runReportId: [
        '',
        Validators.required
      ],
      isNotification: [false]
    });
  }

  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.triggerTypes = this.smsCampaignTemplate.triggerTypeOptions;
    this.smsProviders = this.smsCampaignTemplate.smsProviderOptions;
    this.businessRules = this.smsCampaignTemplate.businessRulesOptions;
    this.setControlValues();
    this.getParameters();
  }

  /**
   * Passes template parameters emitted from child to parent.
   * @param {any} $event Template Parameters
   */
  passParameters($event: any) {
    this.templateParameters.emit($event);
  }

  /**
   * Gets Template parameters and disables the SMS form.
   */
  getParameters() {
    this.reportService.getReportParams(this.smsCampaign.reportName).subscribe((response: ReportParameter[]) => {
      this.paramData = response;
    });
    this.smsCampaignDetailsForm.disable();
  }

  /**
   * Patches all control values as in API response.
   */
  setControlValues() {
    this.smsCampaignDetailsForm.patchValue({
      campaignName: this.smsCampaign.campaignName,
      providerId: this.smsCampaign.providerId,
      triggerType: this.smsCampaign.triggerType.id,
      runReportId: this.smsCampaign.runReportId,
      isNotification: this.smsCampaign.isNotification
    });
    if (this.smsCampaign.triggerType.value === 'Schedule') {
      this.smsCampaignDetailsForm.addControl(
        'recurrenceStartDate',
        new UntypedFormControl(new Date(this.smsCampaign.recurrenceStartDate))
      );
    }
  }
}
