import { createTheme, createThemeContract } from "@vanilla-extract/css"

/**
 * Theme contract defines the structure of the design system.
 * Consumers can provide custom themes that match this contract.
 */
export const themeContract = createThemeContract({
	colors: {
		// Background colors
		background: {
			primary: null,
			secondary: null,
			accent: null,
		},
		// Document node colors
		document: {
			primary: null,
			secondary: null,
			accent: null,
			border: null,
			glow: null,
		},
		// Memory node colors
		memory: {
			primary: null,
			secondary: null,
			accent: null,
			border: null,
			glow: null,
		},
		// Connection strengths
		connection: {
			weak: null,
			memory: null,
			medium: null,
			strong: null,
		},
		// Text colors
		text: {
			primary: null,
			secondary: null,
			muted: null,
		},
		// Accent colors
		accent: {
			primary: null,
			secondary: null,
			glow: null,
			amber: null,
			emerald: null,
		},
		// Status indicators
		status: {
			forgotten: null,
			expiring: null,
			new: null,
		},
		// Relation types
		relations: {
			updates: null,
			extends: null,
			derives: null,
		},
	},
	space: {
		0: null,
		1: null,
		2: null,
		3: null,
		4: null,
		5: null,
		6: null,
		8: null,
		10: null,
		12: null,
		16: null,
		20: null,
		24: null,
		32: null,
		40: null,
		48: null,
		64: null,
	},
	radii: {
		none: null,
		sm: null,
		md: null,
		lg: null,
		xl: null,
		"2xl": null,
		full: null,
	},
	typography: {
		fontSize: {
			xs: null,
			sm: null,
			base: null,
			lg: null,
			xl: null,
			"2xl": null,
			"3xl": null,
		},
		fontWeight: {
			normal: null,
			medium: null,
			semibold: null,
			bold: null,
		},
		lineHeight: {
			tight: null,
			normal: null,
			relaxed: null,
		},
	},
	transitions: {
		fast: null,
		normal: null,
		slow: null,
	},
	zIndex: {
		base: null,
		dropdown: null,
		overlay: null,
		modal: null,
		tooltip: null,
	},
})

/**
 * Default theme implementation based on the original constants.ts colors
 * This provides the glass-morphism dark theme used throughout the app.
 */
export const defaultTheme = createTheme(themeContract, {
	colors: {
		background: {
			primary: "#05070a",
			secondary: "#0a0f16",
			accent: "#121826",
		},
		document: {
			primary: "rgba(180, 200, 255, 0.08)",
			secondary: "rgba(180, 200, 255, 0.15)",
			accent: "rgba(100, 220, 255, 0.25)",
			border: "rgba(100, 220, 255, 0.4)",
			glow: "rgba(56, 189, 248, 0.6)",
		},
		memory: {
			primary: "rgba(236, 72, 153, 0.1)",
			secondary: "rgba(236, 72, 153, 0.2)",
			accent: "rgba(236, 72, 153, 0.3)",
			border: "rgba(236, 72, 153, 0.5)",
			glow: "rgba(236, 72, 153, 0.6)",
		},
		connection: {
			weak: "rgba(148, 163, 184, 0.02)",
			memory: "rgba(236, 72, 153, 0.15)",
			medium: "rgba(147, 197, 253, 0.08)",
			strong: "rgba(56, 189, 248, 0.2)",
		},
		text: {
			primary: "#f0f9ff",
			secondary: "#94a3b8",
			muted: "#475569",
		},
		accent: {
			primary: "#0ea5e9",
			secondary: "#ec4899",
			glow: "rgba(14, 165, 233, 0.5)",
			amber: "rgba(245, 158, 11, 1)",
			emerald: "rgba(16, 185, 129, 1)",
		},
		status: {
			forgotten: "rgba(100, 116, 139, 0.3)",
			expiring: "rgba(245, 158, 11, 0.8)",
			new: "rgba(56, 189, 248, 0.9)",
		},
		relations: {
			updates: "rgba(216, 180, 254, 0.6)",
			extends: "rgba(134, 239, 172, 0.6)",
			derives: "rgba(147, 197, 253, 0.6)",
		},
	},
	space: {
		0: "0",
		1: "0.25rem", // 4px
		2: "0.5rem", // 8px
		3: "0.75rem", // 12px
		4: "1rem", // 16px
		5: "1.25rem", // 20px
		6: "1.5rem", // 24px
		8: "2rem", // 32px
		10: "2.5rem", // 40px
		12: "3rem", // 48px
		16: "4rem", // 64px
		20: "5rem", // 80px
		24: "6rem", // 96px
		32: "8rem", // 128px
		40: "10rem", // 160px
		48: "12rem", // 192px
		64: "16rem", // 256px
	},
	radii: {
		none: "0",
		sm: "0.125rem", // 2px
		md: "0.375rem", // 6px
		lg: "0.5rem", // 8px
		xl: "0.75rem", // 12px
		"2xl": "1rem", // 16px
		full: "9999px",
	},
	typography: {
		fontSize: {
			xs: "0.75rem", // 12px
			sm: "0.875rem", // 14px
			base: "1rem", // 16px
			lg: "1.125rem", // 18px
			xl: "1.25rem", // 20px
			"2xl": "1.5rem", // 24px
			"3xl": "1.875rem", // 30px
		},
		fontWeight: {
			normal: "400",
			medium: "500",
			semibold: "600",
			bold: "700",
		},
		lineHeight: {
			tight: "1.25",
			normal: "1.5",
			relaxed: "1.75",
		},
	},
	transitions: {
		fast: "150ms ease-in-out",
		normal: "200ms ease-in-out",
		slow: "300ms ease-in-out",
	},
	zIndex: {
		base: "0",
		dropdown: "10",
		overlay: "20",
		modal: "30",
		tooltip: "40",
	},
})
