"use client";

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRef, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function CodeInput({
	length,
	disabled,
	invalid,
	describedBy,
}: {
	length: number;
	disabled: boolean;
	invalid: boolean;
	describedBy: string | undefined;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const hasSubmitted = useRef(false);
	const [submitting, setSubmitting] = useState(false);
	const inputIds = Array.from({ length }, (_, index) => `code-character-${index + 1}`);
	const isDisabled = disabled || submitting;

	function submitCompletedCode() {
		if (isDisabled || hasSubmitted.current) return;

		hasSubmitted.current = true;
		setSubmitting(true);
		inputRef.current?.form?.requestSubmit();
	}

	return (
		<InputOTP
			ref={inputRef}
			name="code"
			maxLength={length}
			pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
			onComplete={submitCompletedCode}
			autoFocus
			autoComplete="one-time-code"
			autoCapitalize="characters"
			inputMode="text"
			aria-label="Share code"
			aria-describedby={describedBy}
			aria-invalid={invalid || undefined}
			aria-busy={submitting}
			disabled={isDisabled}
			containerClassName="gap-3"
		>
			<InputOTPGroup className="gap-3 has-aria-invalid:border-0 has-aria-invalid:ring-0">
				{inputIds.map((inputId, index) => (
					<InputOTPSlot
						index={index}
						key={inputId}
						aria-label={`Character ${index + 1} of ${length}`}
						aria-invalid={invalid || undefined}
						className="plan-code-gate-input size-14 rounded-lg border border-line bg-surface-raised font-mono text-ink text-xl uppercase transition-[border-color,box-shadow] duration-150 ease-out data-[active=true]:border-brand data-[active=true]:ring-2 data-[active=true]:ring-brand/20 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
					/>
				))}
			</InputOTPGroup>
			<span className="sr-only" role="status" aria-live="polite">
				{submitting ? "Opening plan" : ""}
			</span>
		</InputOTP>
	);
}
