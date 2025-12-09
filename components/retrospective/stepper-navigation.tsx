"use client";

import React, { ReactNode } from "react";
import { motion, Variants } from "motion/react";

interface StepperNavigationProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  backButtonText?: string;
  nextButtonText?: string;
}

export function StepperNavigation({
  children,
  currentStep,
  totalSteps,
  onStepChange,
  onComplete,
  backButtonText = "Back",
  nextButtonText = "Next",
}: StepperNavigationProps) {
  const isLastStep = currentStep === totalSteps;

  const handleBack = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-4">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card shadow-xl">
        {/* Step indicators */}
        <div className="flex w-full items-center p-8">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                <StepIndicator
                  step={stepNumber}
                  currentStep={currentStep}
                  onClickStep={onStepChange}
                />
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-2 px-8">
          <div className="px-2">{children}</div>
        </div>

        {/* Navigation buttons - hidden on last step since summary has its own actions */}
        {!isLastStep && (
          <div className="px-8 pb-8">
            <div
              className={`mt-10 flex ${currentStep !== 1 ? "justify-between" : "justify-end"}`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className="duration-350 rounded px-2 py-1 text-muted-foreground transition hover:text-foreground"
                >
                  {backButtonText}
                </button>
              )}
              <button
                onClick={handleNext}
                className="duration-350 flex items-center justify-center rounded-full bg-primary py-1.5 px-3.5 font-medium tracking-tight text-primary-foreground transition hover:bg-primary/90 active:bg-primary/80"
              >
                {nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
}: StepIndicatorProps) {
  const status =
    currentStep === step
      ? "active"
      : currentStep < step
        ? "inactive"
        : "complete";

  const handleClick = () => {
    if (step !== currentStep && step < currentStep) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative outline-none focus:outline-none ${step < currentStep ? "cursor-pointer" : ""}`}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: {
            scale: 1,
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
          },
          active: {
            scale: 1,
            backgroundColor: "var(--primary)",
            color: "var(--primary)",
          },
          complete: {
            scale: 1,
            backgroundColor: "var(--primary)",
            color: "var(--primary)",
          },
        }}
        transition={{ duration: 0.3 }}
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold"
      >
        {status === "complete" ? (
          <CheckIcon className="h-4 w-4 text-primary-foreground" />
        ) : status === "active" ? (
          <div className="h-3 w-3 rounded-full bg-primary-foreground" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: "transparent" },
    complete: { width: "100%", backgroundColor: "var(--primary)" },
  };

  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-muted">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? "complete" : "incomplete"}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

type CheckIconProps = React.SVGProps<SVGSVGElement>;

function CheckIcon(props: CheckIconProps) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: "tween",
          ease: "easeOut",
          duration: 0.3,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
