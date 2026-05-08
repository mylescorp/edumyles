export function getNextSetupStepIndex({
  activeStepIndex,
  currentStep,
  totalSteps,
}: {
  activeStepIndex: number;
  currentStep?: number;
  totalSteps: number;
}) {
  const lastStepIndex = Math.max(0, totalSteps - 1);
  const nextStepIndex = Math.min(lastStepIndex, activeStepIndex + 1);

  if (currentStep && currentStep > activeStepIndex + 1) {
    return Math.max(0, Math.min(lastStepIndex, currentStep - 1));
  }

  return nextStepIndex;
}

export function shouldRedirectCompletedSetup(wizardCompleted?: boolean | null) {
  return Boolean(wizardCompleted);
}
