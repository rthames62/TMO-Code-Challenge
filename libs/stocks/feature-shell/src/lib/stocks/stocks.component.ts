import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PriceQueryFacade } from '@coding-challenge/stocks/data-access-price-query';
import { debounceTime, skipWhile, map } from 'rxjs/operators';

@Component({
  selector: 'coding-challenge-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css']
})
export class StocksComponent implements OnInit {
  stockPickerForm: FormGroup;
  symbol: string;
  period: string;

  quotes$ = this.priceQuery.priceQueries$.pipe(map(data => {
    const { fromDate, toDate } = this.stockPickerForm.value;
    if(fromDate || toDate) {
      return this.filterByDateRange(data);
    }
    return data;
  }));

  timePeriods = [
    { viewValue: 'All available data', value: 'max' },
    { viewValue: 'Five years', value: '5y' },
    { viewValue: 'Two years', value: '2y' },
    { viewValue: 'One year', value: '1y' },
    { viewValue: 'Year-to-date', value: 'ytd' },
    { viewValue: 'Six months', value: '6m' },
    { viewValue: 'Three months', value: '3m' },
    { viewValue: 'One month', value: '1m' }
  ];

  constructor(private fb: FormBuilder, private priceQuery: PriceQueryFacade) {
    this.stockPickerForm = this.fb.group({
      symbol: [null, Validators.required],
      period: [null, Validators.required],
      fromDate: [null],
      toDate: [null]
    });
  }

  ngOnInit() {
    const { symbol, fromDate, toDate } = this.stockPickerForm.controls;
    symbol.valueChanges.pipe(debounceTime(400)).subscribe(() => this.fetchQuote());
    fromDate.valueChanges.subscribe(() => this.validateDate('fromDate'));
    toDate.valueChanges.subscribe(() => this.validateDate('toDate'));
    this.stockPickerForm.valueChanges.pipe(skipWhile(() => !fromDate.value || !toDate.value)).subscribe(() => this.compareDates());
  }

  fetchQuote() {
    if (this.stockPickerForm.valid) {
      const { symbol, period, fromDate, toDate } = this.stockPickerForm.value;
      this.priceQuery.fetchQuote(symbol, period);
    }
  }

  selectTimePeriod() {
    this.fetchQuote();
  }

  private validateDate(control: string) {
    const date = this.stockPickerForm.controls[control];
    const currentDay = new Date();

    if(date.value > currentDay) {
      date.setValue(currentDay);
    }
    this.fetchQuote();
  }

  private compareDates() {
    const { fromDate, toDate } = this.stockPickerForm.controls;

    if(fromDate.value && toDate.value) {
      if(fromDate.value > toDate.value) {
        toDate.setValue(fromDate.value);
      }
    }
  }

  private filterByDateRange(items: any[]) {
    const { fromDate, toDate } = this.stockPickerForm.value;
    const filtered = items.filter(item => {
      const date = new Date(item[0]);
      if(fromDate && toDate) {
        return date >= fromDate && date <= toDate;
      } else if(fromDate) {
        return date >= fromDate;
      } else if(toDate) {
        return date <= toDate;
      }
    });
    return filtered;
  }
}
