"use client";

import { unstable_OneTimePasswordField as OneTimePasswordField } from "radix-ui";

export function CodeInput({ length, disabled }: { length: number; disabled: boolean }) {
	const inputIds = Array.from({ length }, (_, index) => `code-character-${index + 1}`);

	return (
		<OneTimePasswordField.Root
			name="code"
			autoFocus
			autoComplete="off"
			aria-label="Share code"
			disabled={disabled}
			type="text"
			validationType="alpha"
			className="flex gap-3"
		>
			{inputIds.map((inputId, index) => (
				<OneTimePasswordField.Input
					// Supplying the index keeps the initial render stable before hydration.
					index={index}
					key={inputId}
					aria-label={`Character ${index + 1} of ${length}`}
					autoCapitalize="characters"
					spellCheck={false}
					className="plan-code-gate-input size-14 rounded-lg border border-line bg-surface-raised text-center font-mono text-ink text-xl uppercase outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
				/>
			))}
			<OneTimePasswordField.HiddenInput />
		</OneTimePasswordField.Root>
	);
}
