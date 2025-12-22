"use client"

import { memo } from "react"
import { Minus, Plus } from "lucide-react"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../ui/tooltip"
import type { GraphNode } from "@/types"
import {
	navContainer,
	navButton,
	zoomContainer,
	zoomInButton,
	zoomOutButton,
} from "./navigation-controls.css"

interface NavigationControlsProps {
	onCenter: () => void
	onZoomIn: () => void
	onZoomOut: () => void
	onAutoFit: () => void
	onToggleFullScreen?: () => void
	isFullScreen?: boolean
	nodes: GraphNode[]
	className?: string
}

export const NavigationControls = memo<NavigationControlsProps>(
	({ onCenter, onZoomIn, onZoomOut, onAutoFit, onToggleFullScreen, isFullScreen, nodes, className = "" }) => {
		if (nodes.length === 0) {
			return null
		}

		const containerClassName = className
			? `${navContainer} ${className}`
			: navContainer

		return (
			<div className={containerClassName}>
				{onToggleFullScreen && (
					<button
						type="button"
						onClick={onToggleFullScreen}
						className={navButton}
					>
						{isFullScreen ? "Exit" : "Full Screen"}
					</button>
				)}

				<button
					type="button"
					onClick={onAutoFit}
					className={navButton}
				>
					Fit
				</button>

				<button
					type="button"
					onClick={onCenter}
					className={navButton}
				>
					Center
				</button>

				<div className={zoomContainer}>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={onZoomIn}
								className={zoomInButton}
							>
								<Plus size={18} strokeWidth={2.5} />
							</button>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>Zoom in</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={onZoomOut}
								className={zoomOutButton}
							>
								<Minus size={18} strokeWidth={2.5} />
							</button>
						</TooltipTrigger>
						<TooltipContent side="left">
							<p>Zoom out</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		)
	},
)

NavigationControls.displayName = "NavigationControls"
