import React, { useMemo } from 'react';

const REQUIREMENTS = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8
  },
  {
    label: 'Contains a lowercase letter',
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: 'Contains an uppercase letter',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'Contains a number',
    test: (password) => /\d/.test(password)
  }
];

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_CLASSES = [
  'bg-red-400',
  'bg-red-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-green-600'
];

const PasswordStrengthMeter = ({ password }) => {
  const { fulfilledCount, requirementsStatus } = useMemo(() => {
    const status = REQUIREMENTS.map((requirement) => ({
      label: requirement.label,
      met: requirement.test(password)
    }));

    const count = status.filter((item) => item.met).length;

    return {
      fulfilledCount: count,
      requirementsStatus: status
    };
  }, [password]);

  const percentage = (fulfilledCount / REQUIREMENTS.length) * 100;
  const levelIndex = Math.min(fulfilledCount, STRENGTH_LABELS.length - 1);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Password strength</span>
        <span className="font-medium">{STRENGTH_LABELS[levelIndex]}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${STRENGTH_CLASSES[levelIndex]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {requirementsStatus.map((requirement) => (
          <li
            key={requirement.label}
            className={`flex items-center gap-2 ${
              requirement.met ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                requirement.met
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-300'
              }`}
            >
              {requirement.met ? '✓' : ''}
            </span>
            {requirement.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;

