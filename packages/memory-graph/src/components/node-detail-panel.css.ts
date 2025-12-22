import { style } from "@vanilla-extract/css"
import { themeContract } from "../styles/theme.css"

/**
 * Main container (positioned absolutely)
 * Highest z-index so it appears above everything when open
 */
export const container = style({
	position: "absolute",
	width: "24rem", // Wider for better readability
	borderRadius: themeContract.radii.xl,
	overflow: "hidden",
	zIndex: 40,
	maxHeight: "calc(100vh - 2rem)",
	top: themeContract.space[4],
	right: themeContract.space[4],

	// Deep glass effect
	backgroundColor: "rgba(10, 15, 25, 0.75)",
	backdropFilter: "blur(20px) saturate(180%)",
	WebkitBackdropFilter: "blur(20px) saturate(180%)",
	border: `1px solid rgba(100, 220, 255, 0.1)`,
	boxShadow: `
		0 20px 40px -5px rgba(0, 0, 0, 0.6),
		0 0 0 1px rgba(100, 220, 255, 0.1) inset
	`,
})

/**
 * Content wrapper with scrolling
 */
export const content = style({
	position: "relative",
	zIndex: 10,
	padding: themeContract.space[5],
	overflowY: "auto",
	maxHeight: "80vh",

	"::-webkit-scrollbar": {
		width: "4px",
	},
	"::-webkit-scrollbar-track": {
		background: "transparent",
	},
	"::-webkit-scrollbar-thumb": {
		background: "rgba(255, 255, 255, 0.1)",
		borderRadius: "2px",
	},
})

/**
 * Header section
 */
export const header = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	marginBottom: themeContract.space[5],
	paddingBottom: themeContract.space[4],
	borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
})

export const headerLeft = style({
	display: "flex",
	alignItems: "center",
	gap: themeContract.space[3],
})

export const headerIcon = style({
	width: "1.5rem",
	height: "1.5rem",
	color: themeContract.colors.text.secondary,
})

export const headerIconMemory = style({
	width: "1.5rem",
	height: "1.5rem",
	color: themeContract.colors.memory.border,
})

export const closeButton = style({
	height: "32px",
	width: "32px",
	padding: 0,
	color: themeContract.colors.text.muted,
	borderRadius: "50%",
	backgroundColor: "transparent",
	transition: "all 0.2s ease",

	selectors: {
		"&:hover": {
			color: themeContract.colors.text.primary,
			backgroundColor: "rgba(255, 255, 255, 0.1)",
		},
	},
})

export const closeIcon = style({
	width: "1.2rem",
	height: "1.2rem",
})

/**
 * Content sections
 */
export const sections = style({
	display: "flex",
	flexDirection: "column",
	gap: themeContract.space[5],
})

export const section = style({})

export const sectionLabel = style({
	fontSize: themeContract.typography.fontSize.xs,
	color: "rgba(100, 220, 255, 0.6)", // Cyan tint for labels
	textTransform: "uppercase",
	letterSpacing: "0.08em",
	fontWeight: themeContract.typography.fontWeight.medium,
	marginBottom: themeContract.space[2],
})

export const sectionValue = style({
	fontSize: themeContract.typography.fontSize.sm,
	color: themeContract.colors.text.primary,
	lineHeight: "1.6",
})

export const sectionValueTruncated = style({
	fontSize: themeContract.typography.fontSize.sm,
	color: themeContract.colors.text.secondary,
	lineHeight: "1.6",
	overflow: "hidden",
	display: "-webkit-box",
	WebkitLineClamp: 4,
	WebkitBoxOrient: "vertical",
})

export const link = style({
	fontSize: themeContract.typography.fontSize.sm,
	color: themeContract.colors.accent.primary,
	display: "inline-flex",
	alignItems: "center",
	gap: themeContract.space[2],
	textDecoration: "none",
	transition: themeContract.transitions.normal,
	padding: `${themeContract.space[2]} ${themeContract.space[3]}`,
	borderRadius: themeContract.radii.md,
	backgroundColor: "rgba(56, 189, 248, 0.1)",

	selectors: {
		"&:hover": {
			backgroundColor: "rgba(56, 189, 248, 0.2)",
			color: themeContract.colors.text.primary,
		},
	},
})

export const linkIcon = style({
	width: "0.875rem",
	height: "0.875rem",
})

export const badge = style({
	marginTop: themeContract.space[2],
})

export const expiryText = style({
	fontSize: themeContract.typography.fontSize.xs,
	color: themeContract.colors.accent.amber,
	marginTop: themeContract.space[2],
	display: "flex",
	alignItems: "center",
	gap: themeContract.space[1],
})

/**
 * Footer section (metadata)
 */
export const footer = style({
	marginTop: themeContract.space[2],
	paddingTop: themeContract.space[4],
	borderTop: "1px solid rgba(255, 255, 255, 0.05)",
})

export const metadata = style({
	display: "flex",
	alignItems: "center",
	gap: themeContract.space[4],
	fontSize: themeContract.typography.fontSize.xs,
	color: themeContract.colors.text.muted,
})

export const metadataItem = style({
	display: "flex",
	alignItems: "center",
	gap: themeContract.space[2],
})

export const metadataIcon = style({
	width: "0.75rem",
	height: "0.75rem",
	opacity: 0.7,
})
