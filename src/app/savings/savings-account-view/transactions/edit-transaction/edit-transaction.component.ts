/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  UntypedFormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Dates } from 'app/core/utils/dates';

/** Custom Services */
import { SavingsService } from 'app/savings/savings.service';
import { SettingsService } from 'app/settings/settings.service';
import { Currency } from 'app/shared/models/general.model';
import { InputAmountComponent } from '../../../../shared/input-amount/input-amount.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Edit Transaction component.
 */
@Component({
  selector: 'mifosx-edit-transaction',
  templateUrl: './edit-transaction.component.html',
  styleUrls: ['./edit-transaction.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    InputAmountComponent,
    MatSlideToggle
  ]
})
export class EditTransactionComponent implements OnInit {
  /** Minimum Due Date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum Due Date allowed. */
  maxDate = new Date();
  /** Savings account transaction form. */
  editTransactionForm: UntypedFormGroup;
  /** savings account transaction payment options. */
  paymentTypeOptions: {
    id: number;
    name: string;
    description: string;
    isCashPayment: boolean;
    position: number;
  }[];
  /** Flag to enable payment details fields. */
  showPaymentDetails: Boolean = false;
  /** saving account's Id */
  savingAccountId: string;
  /** Transaction Template */
  transactionTemplateData: any;
  currency: Currency;

  /**
   * Retrieves the Saving Account transaction template data from `resolve`.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {SavingsService} savingsService Savings Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Dates} dateUtils Date Utils.
   * @param {Router} router Router for navigation.
   * @param {SettingsService} settingsService Setting service
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dateUtils: Dates,
    private savingsService: SavingsService,
    private settingsService: SettingsService
  ) {
    this.route.data.subscribe((data: { savingsAccountTransactionTemplate: any }) => {
      this.transactionTemplateData = data.savingsAccountTransactionTemplate;
      if (data.savingsAccountTransactionTemplate.currency) {
        this.currency = data.savingsAccountTransactionTemplate.currency;
      }
      this.paymentTypeOptions = this.transactionTemplateData.paymentTypeOptions;
    });
    this.savingAccountId = this.route.snapshot.params['savingAccountId'];
  }

  /**
   * Creates the Saving account transaction form when component loads.
   */
  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.createEditTransactionForm();
    this.editTransactionForm.patchValue({
      transactionDate: this.transactionTemplateData.date && new Date(this.transactionTemplateData.date),
      transactionAmount: this.transactionTemplateData.amount,
      paymentTypeId: this.transactionTemplateData.paymentTypeId
    });
  }

  /**
   * Method to create the Saving Account Transaction Form.
   */
  createEditTransactionForm() {
    this.editTransactionForm = this.formBuilder.group({
      transactionDate: [
        '',
        Validators.required
      ],
      transactionAmount: [
        '',
        Validators.required
      ],
      paymentTypeId: ['']
    });
  }

  /**
   * Method to add payment detail fields to the UI.
   */
  addPaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
    if (this.showPaymentDetails) {
      this.editTransactionForm.addControl('accountNumber', new UntypedFormControl(''));
      this.editTransactionForm.addControl('checkNumber', new UntypedFormControl(''));
      this.editTransactionForm.addControl('routingCode', new UntypedFormControl(''));
      this.editTransactionForm.addControl('receiptNumber', new UntypedFormControl(''));
      this.editTransactionForm.addControl('bankNumber', new UntypedFormControl(''));
    } else {
      this.editTransactionForm.removeControl('accountNumber');
      this.editTransactionForm.removeControl('checkNumber');
      this.editTransactionForm.removeControl('routingCode');
      this.editTransactionForm.removeControl('receiptNumber');
      this.editTransactionForm.removeControl('bankNumber');
    }
  }

  /**
   * Method to submit the transaction details.
   */
  submit() {
    const editTransactionFormData = this.editTransactionForm.value;
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const prevTransactionDate: Date = this.editTransactionForm.value.transactionDate;
    if (editTransactionFormData.transactionDate instanceof Date) {
      editTransactionFormData.transactionDate = this.dateUtils.formatDate(prevTransactionDate, dateFormat);
    }
    const data = {
      ...editTransactionFormData,
      dateFormat,
      locale
    };
    this.savingsService
      .executeSavingsAccountTransactionsCommand(this.savingAccountId, 'modify', data, this.transactionTemplateData.id)
      .subscribe((res) => {
        this.router.navigate(['../'], { relativeTo: this.route });
      });
  }
}
