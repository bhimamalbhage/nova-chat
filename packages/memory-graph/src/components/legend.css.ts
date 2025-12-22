import { style, styleVariants, globalStyle } from "@vanilla-extract/css"
import { themeContract } from "../styles/theme.css"

/**
 * Legend container base
 */
const legendContainerBase = style({
	position: "absolute",
	zIndex: 20, // Above most elements but below node detail panel
	borderRadius: themeContract.radii.xl,
	overflow: "hidden",
	width: "fit-content",
	height: "fit-content",
	maxHeight: "calc(100vh - 2rem)", // Prevent overflow
})

/**
 * Legend container variants for positioning
 * Console: Bottom-right (doesn't conflict with anything)
 * Consumer: Bottom-right (moved from top to avoid conflicts)
 */
export const legendContainer = styleVariants({
	consoleDesktop: [
		legendContainerBase,
		{
			bottom: themeContract.space[4],
			right: themeContract.space[4],
		},
	],
	consoleMobile: [
		legendContainerBase,
		{
			bottom: themeContract.space[4],
			right: themeContract.space[4],
			"@media": {
				"screen and (max-width: 767px)": {
					display: "none",
				},
			},
		},
	],
	consumerDesktop: [
		legendContainerBase,
		{
			// Changed from top to bottom to avoid overlap with node detail panel
			bottom: themeContract.space[4],
			right: themeContract.space[4],
		},
	],
	consumerMobile: [
		legendContainerBase,
		{
			bottom: themeContract.space[4],
			right: themeContract.space[4],
			"@media": {
				"screen and (max-width: 767px)": {
					display: "none",
				},
			},
		},
	],
})

/**
 * Mobile size variants
 */
export const mobileSize = styleVariants({
	expanded: {
		maxWidth: "20rem", // max-w-xs
	},
	collapsed: {
		width: "4rem", // w-16
		height: "3rem", // h-12
	},
})

/**
 * Legend content wrapper
 */
export const legendContent = style({
	position: "relative",
	zIndex: 10,
})

/**
 * Collapsed trigger button
 */
export const collapsedTrigger = style({
	width: "100%",
	height: "100%",
	padding: themeContract.space[2],
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	transition: themeContract.transitions.normal,

	selectors: {
		"&:hover": {
			backgroundColor: "rgba(255, 255, 255, 0.05)",
		},
	},
})

export const collapsedContent = style({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: themeContract.space[1],
})

export const collapsedText = style({
	fontSize: themeContract.typography.fontSize.xs,
	color: themeContract.colors.text.secondary,
	fontWeight: themeContract.typography.fontWeight.medium,
})

export const collapsedIcon = style({
	width: "0.75rem",
	height: "0.75rem",
	color: themeContract.colors.text.muted,
})

/**
 * Header
 */
export const legendHeader = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	paddingLeft: themeContract.space[4],
	paddingRight: themeContract.space[4],
	paddingTop: themeContract.space[3],
	paddingBottom: themeContract.space[3],
	borderBottom: `1px solid ${themeContract.colors.document.border}`,
})

export const legendTitle = style({
	fontSize: themeContract.typography.fontSize.sm,
	fontWeight: themeContract.typography.fontWeight.medium,
	color: themeContract.colors.text.primary,
})

export const headerTrigger = style({
	padding: themeContract.space[1],
	borderRadius: themeContract.radii.sm,
	transition: themeContract.transitions.normal,

	selectors: {
		"&:hover": {
			backgroundColor: "rgba(255, 255, 255, 0.1)",
		},
	},
})

export const headerIcon = style({
	width: "1rem",
	height: "1rem",
	color: themeContract.colors.text.muted,
})

/**
 * Content sections
 */
export const sectionsContainer = style({
	fontSize: themeContract.typography.fontSize.xs,
	color: themeContract.colors.text.secondary,
	paddingLeft: themeContract.space[4],
	paddingRight: themeContract.space[4],
	paddingTop: themeContract.space[3],
	paddingBottom: themeContract.space[3],
})

export const sectionWrapper = style({
	marginTop: themeContract.space[3],
	selectors: {
		"&:first-child": {
			marginTop: 0,
		},
	},
})

export const sectionTitle = style({
	fontSize: themeContract.typography.fontSize.xs,
	fontWeight: themeContract.typography.fontWeight.medium,
	color: themeContract.colors.text.secondary,
	textTransform: "uppercase",
	letterSpacing: "0.05em",
	marginBottom: themeContract.space[2],
})

export const itemsList = style({
	display: "flex",
	flexDirection: "column",
	gap: "0.375rem", // gap-1.5
})

export const legendItem = style({
	display: "flex",
	alignItems: "center",
	gap: themeContract.space[2],
})

export const legendIcon = style({
	width: "0.75rem",
	height: "0.75rem",
	flexShrink: 0,
})

export const legendText = style({
	fontSize: themeContract.typography.fontSize.xs,
})

/**
 * Shape styles
 */
export const hexagon = style({
	clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
})

export const documentNode = style({
	width: "1rem",
	height: "0.75rem",
	background: themeContract.colors.document.primary,
	border: `1px solid ${themeContract.colors.document.border}`,
	borderRadius: themeContract.radii.sm,
	flexShrink: 0,
})

export const memoryNode = style([
	hexagon,
	{
		width: "0.75rem",
		height: "0.75rem",
		background: themeContract.colors.memory.primary,
		border: `1px solid ${themeContract.colors.memory.border}`,
		flexShrink: 0,
	},
])

export const memoryNodeOlder = style([
	memoryNode,
	{
		opacity: 0.5,
	},
])

export const forgottenNode = style([
	hexagon,
	{
		width: "0.75rem",
		height: "0.75rem",
		background: themeContract.colors.status.forgotten,
		border: `1px solid ${themeContract.colors.status.forgotten}`,
		position: "relative",
		flexShrink: 0,
	},
])

export const forgottenIcon = style({
	position: "absolute",
	inset: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	color: themeContract.colors.status.forgotten,
	fontSize: themeContract.typography.fontSize.xs,
	lineHeight: "1",
})

export const expiringNode = style([
	hexagon,
	{
		width: "0.75rem",
		height: "0.75rem",
		background: themeContract.colors.memory.primary,
		border: `2px solid ${themeContract.colors.status.expiring}`,
		flexShrink: 0,
	},
])

export const newNode = style([
	hexagon,
	{
		width: "0.75rem",
		height: "0.75rem",
		background: themeContract.colors.memory.primary,
		border: `2px solid ${themeContract.colors.status.new}`,
		position: "relative",
		flexShrink: 0,
	},
])

export const newBadge = style({
	position: "absolute",
	top: "-0.25rem",
	right: "-0.25rem",
	width: "0.5rem",
	height: "0.5rem",
	backgroundColor: themeContract.colors.status.new,
	borderRadius: themeContract.radii.full,
})

export const connectionLine = style({
	width: "1rem",
	height: 0,
	borderTop: `1px solid ${themeContract.colors.connection.strong}`,
	flexShrink: 0,
})

export const similarityLine = style({
	width: "1rem",
	height: 0,
	borderTop: `2px dashed ${themeContract.colors.connection.medium}`,
	flexShrink: 0,
})

export const relationLine = style({
	width: "1rem",
	height: 0,
	borderTop: "2px solid",
	flexShrink: 0,
})

export const weakSimilarity = style({
	width: "0.75rem",
	height: "0.75rem",
	borderRadius: themeContract.radii.full,
	background: themeContract.colors.connection.weak,
	flexShrink: 0,
})

export const strongSimilarity = style({
	width: "0.75rem",
	height: "0.75rem",
	borderRadius: themeContract.radii.full,
	background: themeContract.colors.connection.strong,
	flexShrink: 0,
})

export const gradientCircle = style({
	width: "0.75rem",
	height: "0.75rem",
	background: `linear-gradient(to right, ${themeContract.colors.connection.weak}, ${themeContract.colors.accent.primary})`,
	borderRadius: themeContract.radii.full,
})

export const memoryIcon = style([
legendIcon,
{
color: themeContract.colors.accent.primary,
},
])

export const documentIcon = style([
legendIcon,
{
color: themeContract.colors.text.secondary,
},
])
