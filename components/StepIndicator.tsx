
import React from 'react';
import type { AppStep } from '../types';
import { AppStep as AppStepEnum } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStepEnum.INPUT, label: 'Topic & Style' },
  { id: AppStepEnum.SCRIPT_REVIEW, label: 'Review Script' },
  { id: AppStepEnum.GENERATING, label: 'Generate Video' },
  { id: AppStepEnum.RESULT, label: 'View Result' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.label} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-indigo-600" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-900"
                >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                  </svg>
                  <span className="sr-only">{step.label}</span>
                </div>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-700" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-slate-800"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                  <span className="absolute -bottom-6 text-center w-24 text-xs text-indigo-400 font-semibold">{step.label}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-700" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800 hover:border-slate-400"
                >
                   <span className="absolute -bottom-6 text-center w-24 text-xs text-slate-400">{step.label}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default StepIndicator;
