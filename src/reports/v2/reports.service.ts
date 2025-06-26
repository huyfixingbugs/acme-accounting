import { Injectable } from "@nestjs/common";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

@Injectable()
export class ReportsServiceV2 {
  private start = performance.now();
  private states = {
    accounts: 'idle',
    yearly: 'idle',
    fs: 'idle',
  };

  state(scope: string) {
    return this.states[scope];
  }

  async generate() {
    this.states.accounts = 'starting';
    this.states.yearly = 'starting';
    this.states.fs = 'starting';

    return new Promise((resolve, reject) => {
      this.start = performance.now();
      const tmpDir = 'tmp';
      
      const accountBalances: Record<string, number> = {};
      const yearlyCashBalances: Record<string, number> = {};

      fs.readdir(tmpDir, (err, files) => {
        if (err) {
          reject(`Error reading directory ${tmpDir}: ${err.message}`);
          return;
        }
        files.forEach((file) => {
          if (!file.endsWith('.csv')) {
            return;
          }
          const lines = fs
            .readFileSync(path.join(tmpDir, file), 'utf-8')
            .trim()
            .split('\n');
          for (const line of lines) {
            const [date, account, , debit, credit] = line.split(',');
            let balance = parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
            if (!accountBalances[account]) {
              accountBalances[account] = 0;
            }
            accountBalances[account] += balance;
    
            if (account === 'Cash') {
              const year = date.split('-')[0];
              if (!yearlyCashBalances[year]) {
                yearlyCashBalances[year] = 0;
              }
              yearlyCashBalances[year] += balance;
            }
          }
        });

        this.accounts(accountBalances);
        this.yearly(yearlyCashBalances);
        this.fs(accountBalances);

        console.log(`finished in ${((performance.now() - this.start) / 1000).toFixed(2)}`);
        resolve(true);
      });
    })
  }

  accounts(accountBalances: Record<string, number>) {
    const outputFile = 'out/accounts-v2.csv';
    const output = ['Account,Balance'];
    for (const [account, balance] of Object.entries(accountBalances)) {
      output.push(`${account},${balance.toFixed(2)}`);
    }
    fs.writeFileSync(outputFile, output.join('\n'));
    this.states.accounts = `finished in ${((performance.now() - this.start) / 1000).toFixed(2)}`;
  }

  yearly(yearlyCashBalances: Record<string, number>) {
    const outputFile = 'out/yearly-v2.csv';
    const output = ['Financial Year,Cash Balance'];
    for (const [year, balance] of Object.entries(yearlyCashBalances)) {
      output.push(`${year},${balance.toFixed(2)}`);
    }
    fs.writeFileSync(outputFile, output.join('\n'));
    this.states.yearly = `finished in ${((performance.now() - this.start) / 1000).toFixed(2)}`;
  }

  fs(accountBalances: Record<string, number>) {
    const outputFile = 'out/fs-v2.csv';
    const categories = {
      'Income Statement': {
        Revenues: ['Sales Revenue'],
        Expenses: [
          'Cost of Goods Sold',
          'Salaries Expense',
          'Rent Expense',
          'Utilities Expense',
          'Interest Expense',
          'Tax Expense',
        ],
      },
      'Balance Sheet': {
        Assets: [
          'Cash',
          'Accounts Receivable',
          'Inventory',
          'Fixed Assets',
          'Prepaid Expenses',
        ],
        Liabilities: [
          'Accounts Payable',
          'Loan Payable',
          'Sales Tax Payable',
          'Accrued Liabilities',
          'Unearned Revenue',
          'Dividends Payable',
        ],
        Equity: ['Common Stock', 'Retained Earnings'],
      },
    };
    const output: string[] = [];
    output.push('Basic Financial Statement');
    output.push('');
    output.push('Income Statement');
    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const account of categories['Income Statement']['Revenues']) {
      const value = accountBalances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalRevenue += value;
    }
    for (const account of categories['Income Statement']['Expenses']) {
      const value = accountBalances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalExpenses += value;
    }
    output.push(`Net Income,${(totalRevenue - totalExpenses).toFixed(2)}`);
    output.push('');
    output.push('Balance Sheet');
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    output.push('Assets');
    for (const account of categories['Balance Sheet']['Assets']) {
      const value = accountBalances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalAssets += value;
    }
    output.push(`Total Assets,${totalAssets.toFixed(2)}`);
    output.push('');
    output.push('Liabilities');
    for (const account of categories['Balance Sheet']['Liabilities']) {
      const value = accountBalances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalLiabilities += value;
    }
    output.push(`Total Liabilities,${totalLiabilities.toFixed(2)}`);
    output.push('');
    output.push('Equity');
    for (const account of categories['Balance Sheet']['Equity']) {
      const value = accountBalances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalEquity += value;
    }
    output.push(
      `Retained Earnings (Net Income),${(totalRevenue - totalExpenses).toFixed(2)}`,
    );
    totalEquity += totalRevenue - totalExpenses;
    output.push(`Total Equity,${totalEquity.toFixed(2)}`);
    output.push('');
    output.push(
      `Assets = Liabilities + Equity, ${totalAssets.toFixed(2)} = ${(totalLiabilities + totalEquity).toFixed(2)}`,
    );
    fs.writeFileSync(outputFile, output.join('\n'));
    this.states.fs = `finished in ${((performance.now() - this.start) / 1000).toFixed(2)}`;
  }
}
