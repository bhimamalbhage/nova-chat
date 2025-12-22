import { style } from "@vanilla-extract/css"
import { themeContract } from "../styles/theme.css"

/**
 * Navigation controls container
 */
export const navContainer = style({
	display: "flex",
	flexDirection: "column",
	gap: themeContract.space[2],
	filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))",
})

/**
 * Base button styles for navigation controls
 */
const navButtonBase = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: "rgba(18, 24, 38, 0.6)", // colors.background.accent with opacity
	backdropFilter: "blur(12px)",
	WebkitBackdropFilter: "blur(12px)",
	border: `1px solid rgba(100, 220, 255, 0.15)`, // colors.document.accent
	borderRadius: themeContract.radii.lg,
	padding: "0 12px",
	minWidth: "40px",
	width: "auto",
	height: "40px",
	color: "rgba(255, 255, 255, 0.6)",
	fontSize: themeContract.typography.fontSize.sm,
	cursor: "pointer",
	transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
	outline: "none",

	selectors: {
		"&:hover": {
			backgroundColor: "rgba(56, 189, 248, 0.15)", // colors.accent.primary
			borderColor: "rgba(56, 189, 248, 0.4)",
			color: "rgba(255, 255, 255, 1)",
			transform: "translateY(-1px)",
			boxShadow: "0 0 15px rgba(56, 189, 248, 0.2)",
		},
		"&:active": {
			transform: "translateY(0px)",
		},
	},
})

/**
 * Standard navigation button
 */
export const navButton = navButtonBase

/**
 * Zoom controls container
 */
export const zoomContainer = style({
	display: "flex",
	flexDirection: "column",
	borderRadius: themeContract.radii.lg,
	overflow: "hidden",
	border: `1px solid rgba(100, 220, 255, 0.15)`,
})

const zoomBtnCommon = {
	width: "100%",
	height: "40px",
	border: "none",
	borderRadius: 0,
	backgroundColor: "rgba(18, 24, 38, 0.6)",
}

/**
 * Zoom in button (top half)
 */
export const zoomInButton = style([
	navButtonBase,
	zoomBtnCommon,
	{
		borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
		selectors: {
			"&:hover": {
				backgroundColor: "rgba(56, 189, 248, 0.15)",
				color: "rgba(255, 255, 255, 1)",
			}
		}
	},
])

/**
 * Zoom out button (bottom half)
 */
export const zoomOutButton = style([
	navButtonBase,
	zoomBtnCommon,
	{
		selectors: {
			"&:hover": {
				backgroundColor: "rgba(56, 189, 248, 0.15)",
				color: "rgba(255, 255, 255, 1)",
			}
		}
	},
])
