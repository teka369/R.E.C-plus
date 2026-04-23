"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = resolvedTheme === "dark";

	return (
		<button
			type="button"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rec-border-default bg-rec-bg-muted text-rec-text-secondary hover:bg-rec-bg-subtle"
			aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
			aria-pressed={isDark}
			disabled={!mounted}
		>
			{!mounted ? (
				<span className="h-4 w-4 rounded-full bg-rec-text-subtle/30" aria-hidden />
			) : isDark ? (
				<IconSun className="h-4 w-4" />
			) : (
				<IconMoon className="h-4 w-4" />
			)}
		</button>
	);
}

function IconMoon(props: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className} aria-hidden>
			<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function IconSun(props: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className} aria-hidden>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
		</svg>
	);
}
