// Enhanced "Future Glass" color palette
export const colors = {
	background: {
		primary: "#05070a", // Deep void black
		secondary: "#0a0f16", // Lighter void
		accent: "#121826", // Component backgrounds
	},
	document: {
		primary: "rgba(180, 200, 255, 0.08)", // Cold white/blue glass
		secondary: "rgba(180, 200, 255, 0.15)", // More visible
		accent: "rgba(100, 220, 255, 0.25)", // Cyan tint for active
		border: "rgba(100, 220, 255, 0.4)", // Sharp cyan border
		glow: "rgba(56, 189, 248, 0.6)", // Cyan glow
	},
	memory: {
		primary: "rgba(236, 72, 153, 0.1)", // Pink/Magenta glass
		secondary: "rgba(236, 72, 153, 0.2)", // More visible
		accent: "rgba(236, 72, 153, 0.3)", // Hover state
		border: "rgba(236, 72, 153, 0.5)", // Sharp pink border
		glow: "rgba(236, 72, 153, 0.6)", // Pink glow
	},
	connection: {
		weak: "rgba(148, 163, 184, 0.02)", // Extremely faint
		memory: "rgba(236, 72, 153, 0.15)", // Very subtle pink
		medium: "rgba(147, 197, 253, 0.08)", // Very subtle blue-ish
		strong: "rgba(56, 189, 248, 0.2)", // Subtle Cyan
	},
	text: {
		primary: "#f0f9ff", // Ice white
		secondary: "#94a3b8", // Blue-gray
		muted: "#475569", // Darker slate
	},
	accent: {
		primary: "#0ea5e9", // Sky blue
		secondary: "#ec4899", // Pink
		glow: "rgba(14, 165, 233, 0.5)",
		amber: "rgba(245, 158, 11, 1)",
		emerald: "rgba(16, 185, 129, 1)",
	},
	status: {
		forgotten: "rgba(100, 116, 139, 0.3)", // Greyed out
		expiring: "rgba(245, 158, 11, 0.8)", // Orange
		new: "rgba(56, 189, 248, 0.9)", // Bright Blue
	},
	relations: {
		updates: "rgba(216, 180, 254, 0.6)", // Purple
		extends: "rgba(134, 239, 172, 0.6)", // Green
		derives: "rgba(147, 197, 253, 0.6)", // Blue
	},
}

export const LAYOUT_CONSTANTS = {
	centerX: 400,
	centerY: 300,
	clusterRadius: 300, // Memory "bubble" size around a doc - smaller bubble
	spaceSpacing: 1600, // How far apart the *spaces* (groups of docs) sit - push spaces way out
	documentSpacing: 1000, // How far the first doc in a space sits from its space-centre - push docs way out
	minDocDist: 900, // Minimum distance two documents in the **same space** are allowed to be - sets repulsion radius
	memoryClusterRadius: 300,
}

// Graph view settings
export const GRAPH_SETTINGS = {
	console: {
		initialZoom: 0.8, // Higher zoom for console - better overview
		initialPanX: 0,
		initialPanY: 0,
	},
	consumer: {
		initialZoom: 0.5, // Changed from 0.1 to 0.5 for better initial visibility
		initialPanX: 400, // Pan towards center to compensate for larger layout
		initialPanY: 300, // Pan towards center to compensate for larger layout
	},
}

// Responsive positioning for different app variants
export const POSITIONING = {
	console: {
		legend: {
			desktop: "bottom-4 right-4",
			mobile: "bottom-4 right-4",
		},
		loadingIndicator: "top-20 right-4",

		spacesSelector: "top-4 left-4",
		viewToggle: "", // Not used in console
		nodeDetail: "top-4 right-4",
	},
	consumer: {
		legend: {
			desktop: "top-18 right-4",
			mobile: "bottom-[180px] left-4",
		},
		loadingIndicator: "top-20 right-4",

		spacesSelector: "", // Hidden in consumer
		viewToggle: "top-4 right-4", // Consumer has view toggle
		nodeDetail: "top-4 right-4",
	},
}
