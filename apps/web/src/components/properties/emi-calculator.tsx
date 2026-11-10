'use client';

import { useState } from 'react';

interface EmiCalculatorProps {
  propertyPrice: number;
}

export function EmiCalculator({ propertyPrice }: EmiCalculatorProps) {
  // Default loan amount: 80% of property price
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);

  const loanAmount = Math.max(0, propertyPrice * (1 - downPaymentPercent / 100));
  const monthlyInterestRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  // EMI formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const emi =
    monthlyInterestRate === 0
      ? loanAmount / totalMonths
      : (loanAmount *
          monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, totalMonths)) /
        (Math.pow(1 + monthlyInterestRate, totalMonths) - 1);

  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  const formatCurrency = (val: number) => {
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm transition-colors">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🧮</span>
          <div>
            <h2 className="text-base font-extrabold text-text-primary">Home Loan EMI Calculator</h2>
            <p className="text-xs text-text-muted">Estimate monthly payments based on loan tenure and interest rate</p>
          </div>
        </div>
        <span className="rounded-lg bg-brand-primary/10 px-2.5 py-1 text-xs font-bold text-brand-primary dark:text-brand-accent">
          8.5% p.a. starting
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          {/* Down Payment Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-text-primary mb-1.5">
              <span>Down Payment ({downPaymentPercent}%)</span>
              <span className="text-brand-primary dark:text-brand-accent font-bold">
                {formatCurrency(propertyPrice * (downPaymentPercent / 100))}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-brand-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
              <span>10% (Min)</span>
              <span>Loan Amount: {formatCurrency(loanAmount)}</span>
              <span>50%</span>
            </div>
          </div>

          {/* Interest Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-text-primary mb-1.5">
              <span>Interest Rate</span>
              <span className="text-brand-primary dark:text-brand-accent font-bold">{interestRate}% p.a.</span>
            </div>
            <input
              type="range"
              min="7.5"
              max="13"
              step="0.25"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-brand-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
              <span>7.5%</span>
              <span>Avg Bank Rate</span>
              <span>13.0%</span>
            </div>
          </div>

          {/* Loan Tenure Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-text-primary mb-1.5">
              <span>Loan Tenure</span>
              <span className="text-brand-primary dark:text-brand-accent font-bold">{tenureYears} Years</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-brand-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
              <span>5 Years</span>
              <span>{tenureYears * 12} Installments</span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-secondary/50 p-5">
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Estimated Monthly EMI
            </span>
            <p className="mt-1 text-3xl font-black text-brand-primary dark:text-brand-accent">
              {formatCurrency(emi)} <span className="text-xs font-semibold text-text-muted">/ month</span>
            </p>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-border-subtle pt-4 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Principal Loan:</span>
              <span className="font-bold text-text-primary">{formatCurrency(loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Total Interest Payable:</span>
              <span className="font-bold text-text-primary">{formatCurrency(totalInterest)}</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-2">
              <span className="font-bold text-text-primary">Total Amount (Loan + Interest):</span>
              <span className="font-extrabold text-brand-primary dark:text-brand-accent">
                {formatCurrency(totalPayment)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-text-muted text-center leading-tight">
            *Indicative EMI calculation based on prevailing market interest rates. Actual terms subject to bank approval.
          </p>
        </div>
      </div>
    </div>
  );
}

