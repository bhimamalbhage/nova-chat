"use client"

import {
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react"
import { colors } from "../constants"
import type {
	DocumentWithMemories,
	GraphCanvasProps,
	GraphNode,
	MemoryEntry,
} from "../types"
import { canvasWrapper } from "./canvas-common.css"

export const GraphCanvas = memo<GraphCanvasProps>(
	({
		nodes,
		edges,
		panX,
		panY,
		zoom,
		width,
		height,
		onNodeHover,
		onNodeClick,
		onNodeDragStart,
		onNodeDragMove,
		onNodeDragEnd,
		onPanStart,
		onPanMove,
		onPanEnd,
		onWheel,
		onDoubleClick,
		onTouchStart,
		onTouchMove,
		onTouchEnd,
		draggingNodeId,
		highlightDocumentIds,
	}) => {
		const canvasRef = useRef<HTMLCanvasElement>(null)
		const animationRef = useRef<number>(0)
		const startTimeRef = useRef<number>(Date.now())
		const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
		const currentHoveredNode = useRef<string | null>(null)

		// Initialize start time once
		useEffect(() => {
			startTimeRef.current = Date.now()
		}, [])

		// Efficient hit detection
		const getNodeAtPosition = useCallback(
			(x: number, y: number): string | null => {
				// Check from top-most to bottom-most: memory nodes are drawn after documents
				for (let i = nodes.length - 1; i >= 0; i--) {
					const node = nodes[i]!
					const screenX = node.x * zoom + panX
					const screenY = node.y * zoom + panY
					const nodeSize = node.size * zoom

					const dx = x - screenX
					const dy = y - screenY
					const distance = Math.sqrt(dx * dx + dy * dy)

					if (distance <= nodeSize / 2) {
						return node.id
					}
				}
				return null
			},
			[nodes, panX, panY, zoom],
		)

		// Handle mouse events
		const handleMouseMove = useCallback(
			(e: React.MouseEvent) => {
				const canvas = canvasRef.current
				if (!canvas) return

				const rect = canvas.getBoundingClientRect()
				const x = e.clientX - rect.left
				const y = e.clientY - rect.top

				mousePos.current = { x, y }

				const nodeId = getNodeAtPosition(x, y)
				if (nodeId !== currentHoveredNode.current) {
					currentHoveredNode.current = nodeId
					onNodeHover(nodeId)
				}

				// Handle node dragging
				if (draggingNodeId) {
					onNodeDragMove(e)
				}
			},
			[getNodeAtPosition, onNodeHover, draggingNodeId, onNodeDragMove],
		)

		const handleMouseDown = useCallback(
			(e: React.MouseEvent) => {
				const canvas = canvasRef.current
				if (!canvas) return

				const rect = canvas.getBoundingClientRect()
				const x = e.clientX - rect.left
				const y = e.clientY - rect.top

				const nodeId = getNodeAtPosition(x, y)
				if (nodeId) {
					// When starting a node drag, prevent initiating pan
					e.stopPropagation()
					onNodeDragStart(nodeId, e)
					return
				}
				onPanStart(e)
			},
			[getNodeAtPosition, onNodeDragStart, onPanStart],
		)

		const handleClick = useCallback(
			(e: React.MouseEvent) => {
				const canvas = canvasRef.current
				if (!canvas) return

				const rect = canvas.getBoundingClientRect()
				const x = e.clientX - rect.left
				const y = e.clientY - rect.top

				const nodeId = getNodeAtPosition(x, y)
				if (nodeId) {
					onNodeClick(nodeId)
				}
			},
			[getNodeAtPosition, onNodeClick],
		)

		// Professional rendering function with LOD
		const render = useCallback(() => {
			const canvas = canvasRef.current
			if (!canvas) return

			const ctx = canvas.getContext("2d")
			if (!ctx) return

			// Level-of-detail optimization
			const useSimplifiedRendering = zoom < 0.35

			// Clear & Background
			ctx.clearRect(0, 0, width, height)

			// Fill with deep void background
			ctx.fillStyle = colors.background.primary
			ctx.fillRect(0, 0, width, height)

			// Set high quality rendering
			ctx.imageSmoothingEnabled = true
			ctx.imageSmoothingQuality = "high"

			// Draw subtle dot grid instead of lines for cleaner look
			const gridSpacing = 40 * zoom
			const offsetX = panX % gridSpacing
			const offsetY = panY % gridSpacing

			if (!useSimplifiedRendering) {
				ctx.fillStyle = "rgba(100, 149, 237, 0.07)" // Very subtle blue-ish dots
				for (let x = offsetX; x < width; x += gridSpacing) {
					for (let y = offsetY; y < height; y += gridSpacing) {
						ctx.beginPath()
						ctx.arc(x, y, 1 * zoom, 0, Math.PI * 2)
						ctx.fill()
					}
				}
			}

			// Create node lookup map
			const nodeMap = new Map(nodes.map((node) => [node.id, node]))

			// Focus Mode Logic: Identify neighbors if hovering
			const hoveredNodeId = currentHoveredNode.current
			const neighborSet = new Set<string>()
			const relatedEdgeSet = new Set<string>() // Store edge IDs if available, or just use logic

			if (hoveredNodeId) {
				neighborSet.add(hoveredNodeId)
				edges.forEach((edge) => {
					if (edge.source === hoveredNodeId) {
						neighborSet.add(edge.target)
						relatedEdgeSet.add(`${edge.source}-${edge.target}`)
					} else if (edge.target === hoveredNodeId) {
						neighborSet.add(edge.source)
						relatedEdgeSet.add(`${edge.source}-${edge.target}`)
					}
				})
			}

			// Draw enhanced edges
			ctx.lineCap = "round"
			edges.forEach((edge) => {
				const sourceNode = nodeMap.get(edge.source)
				const targetNode = nodeMap.get(edge.target)

				if (sourceNode && targetNode) {
					const sourceX = sourceNode.x * zoom + panX
					const sourceY = sourceNode.y * zoom + panY
					const targetX = targetNode.x * zoom + panX
					const targetY = targetNode.y * zoom + panY

					// Viewport culling
					if (
						sourceX < -100 || sourceX > width + 100 ||
						targetX < -100 || targetX > width + 100
					) return

					// Focus Mode: Dim unrelated edges
					const isRelated = hoveredNodeId
						? (edge.source === hoveredNodeId || edge.target === hoveredNodeId)
						: true

					// Skip weak edges on zoom out (unless related)
					if (!isRelated && useSimplifiedRendering && edge.visualProps.opacity < 0.3) return

					let connectionColor: string | CanvasGradient = colors.connection.weak
					let dashPattern: number[] = []
					let opacity = edge.visualProps.opacity
					let lineWidth = Math.max(1, edge.visualProps.thickness * zoom)

					if (hoveredNodeId && !isRelated) {
						opacity *= 0.1 // Dim unrelated edges significantly
					} else if (hoveredNodeId && isRelated) {
						opacity = Math.min(1, opacity * 1.5) // Boost connected edges
						lineWidth *= 1.5
					}

					if (edge.edgeType === "doc-memory") {
						connectionColor = colors.connection.memory
						if (!hoveredNodeId) opacity = 0.6
						if (!isRelated && hoveredNodeId) lineWidth = 0.25
					} else if (edge.edgeType === "doc-doc") {
						const isStrong = edge.similarity > 0.8
						// Gradient for strong connections
						if (isStrong && !useSimplifiedRendering) {
							const grad = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY)
							grad.addColorStop(0, "rgba(56, 189, 248, 0.05)")
							grad.addColorStop(0.5, "rgba(56, 189, 248, 0.4)")
							grad.addColorStop(1, "rgba(56, 189, 248, 0.05)")
							connectionColor = grad
						} else {
							connectionColor = isStrong ? colors.connection.strong : colors.connection.medium
						}

						dashPattern = useSimplifiedRendering ? [] : [4, 8] // Wider invisible gaps
						lineWidth = Math.max(0.2, edge.similarity * 0.8)
					} else if (edge.edgeType === "version") {
						connectionColor = edge.color || colors.relations.updates
						if (!hoveredNodeId) opacity = 0.8
						lineWidth = 2
					}

					ctx.strokeStyle = connectionColor
					ctx.lineWidth = lineWidth
					ctx.globalAlpha = opacity
					ctx.setLineDash(dashPattern)

					// Version chains: Double line
					if (edge.edgeType === "version") {
						ctx.lineWidth = hoveredNodeId && !isRelated ? 1 : 3
						ctx.globalAlpha = opacity * 0.3
						ctx.beginPath()
						ctx.moveTo(sourceX, sourceY)
						ctx.lineTo(targetX, targetY)
						ctx.stroke()

						ctx.lineWidth = 1
						ctx.globalAlpha = opacity
					}

					// Draw Line
					ctx.beginPath()
					if (useSimplifiedRendering || edge.edgeType === "version") {
						ctx.moveTo(sourceX, sourceY)
						ctx.lineTo(targetX, targetY)
					} else {
						// Organic curved lines
						const midX = (sourceX + targetX) / 2
						const midY = (sourceY + targetY) / 2
						const dx = targetX - sourceX
						const dy = targetY - sourceY
						const dist = Math.sqrt(dx * dx + dy * dy)

						// Control point perpendicular to midpoint
						const offset = Math.min(dist * 0.15, 40)
						// Determine direction based on node usage or random stable seed?
						// Simpler: Just curve slightly based on slope

						ctx.moveTo(sourceX, sourceY)
						ctx.quadraticCurveTo(
							midX + offset * (dy / dist),
							midY - offset * (dx / dist),
							targetX,
							targetY
						)
					}
					ctx.stroke()

					// Version Arrow
					if (edge.edgeType === "version") {
						const angle = Math.atan2(targetY - sourceY, targetX - sourceX)
						const arrowLen = 10 * zoom
						const nodeRadius = (targetNode.size * zoom) / 2 + 5
						const arrowX = targetX - Math.cos(angle) * nodeRadius
						const arrowY = targetY - Math.sin(angle) * nodeRadius

						ctx.save()
						ctx.translate(arrowX, arrowY)
						ctx.rotate(angle)
						ctx.fillStyle = connectionColor
						ctx.beginPath()
						ctx.moveTo(0, 0)
						ctx.lineTo(-arrowLen, arrowLen / 3)
						ctx.lineTo(-arrowLen, -arrowLen / 3)
						ctx.fill()
						ctx.restore()
					}
				}
			})

			ctx.globalAlpha = 1
			ctx.setLineDash([])

			const highlightSet = new Set<string>(highlightDocumentIds ?? [])

			// Draw Nodes
			nodes.forEach((node) => {
				const screenX = node.x * zoom + panX
				const screenY = node.y * zoom + panY
				const nodeSize = node.size * zoom

				// Culling included
				if (screenX < -100 || screenX > width + 100 || screenY < -100 || screenY > height + 100) return

				const isHovered = hoveredNodeId === node.id
				const isDragging = node.isDragging

				// Focus Mode: Dim unrelated nodes
				const isNeighbor = hoveredNodeId ? neighborSet.has(node.id) : true
				const alphaMultiplier = isNeighbor ? 1 : 0.2

				ctx.globalAlpha = alphaMultiplier

				// Document Node
				if (node.type === "document") {
					const docWidth = nodeSize * 1.6 // Wider cards
					const docHeight = nodeSize * 1.0
					const radius = 8

					// Glow for hovered/active
					if ((isHovered || isDragging) && !useSimplifiedRendering) {
						ctx.shadowColor = colors.document.glow
						ctx.shadowBlur = 30
					} else {
						ctx.shadowBlur = 0
					}

					// Glass Body
					ctx.fillStyle = (isHovered || isDragging) ? colors.document.secondary : colors.document.primary
					ctx.beginPath()
					ctx.roundRect(screenX - docWidth / 2, screenY - docHeight / 2, docWidth, docHeight, radius)
					ctx.fill()

					// Clean Border
					ctx.strokeStyle = (isHovered || isDragging) ? colors.document.accent : colors.document.border
					ctx.lineWidth = (isHovered || isDragging) ? 2 : 1
					ctx.stroke()

					// Tech detail: Corner accents
					if (!useSimplifiedRendering) {
						const cornerLen = 6
						ctx.strokeStyle = colors.accent.primary
						ctx.lineWidth = 2
						ctx.beginPath()
						// Top Left
						ctx.moveTo(screenX - docWidth / 2, screenY - docHeight / 2 + cornerLen)
						ctx.lineTo(screenX - docWidth / 2, screenY - docHeight / 2)
						ctx.lineTo(screenX - docWidth / 2 + cornerLen, screenY - docHeight / 2)
						ctx.stroke()
						// Bottom Right
						ctx.beginPath()
						ctx.moveTo(screenX + docWidth / 2, screenY + docHeight / 2 - cornerLen)
						ctx.lineTo(screenX + docWidth / 2, screenY + docHeight / 2)
						ctx.lineTo(screenX + docWidth / 2 - cornerLen, screenY + docHeight / 2)
						ctx.stroke()
					}

				}
				// Memory Node
				else {
					const mem = node.data as MemoryEntry
					// Re-calc simple flags
					const isNew = !mem.isForgotten && (Date.now() - new Date(mem.createdAt).getTime() < 86400000)

					let radius = nodeSize / 2
					if (isHovered) radius *= 1.2

					// Glow
					if ((isHovered || isDragging) && !useSimplifiedRendering) {
						ctx.shadowColor = colors.memory.glow
						ctx.shadowBlur = 20
					} else {
						ctx.shadowBlur = 0
					}

					// Shape: Circle or Hexagon
					ctx.fillStyle = colors.memory.primary
					ctx.strokeStyle = isHovered ? colors.memory.accent : colors.memory.border
					ctx.lineWidth = 1.5

					ctx.beginPath()
					if (useSimplifiedRendering) {
						ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
					} else {
						// Hexagon for tech feel
						const sides = 6
						for (let i = 0; i < sides; i++) {
							const angle = (i * 2 * Math.PI) / sides - Math.PI / 6
							const x = screenX + radius * Math.cos(angle)
							const y = screenY + radius * Math.sin(angle)
							i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
						}
						ctx.closePath()
					}
					ctx.fill()
					ctx.stroke()

					// Center dot (Core)
					if (!useSimplifiedRendering) {
						ctx.fillStyle = isNew ? colors.status.new : colors.memory.secondary
						ctx.beginPath()
						ctx.arc(screenX, screenY, isNew ? 3 : 2, 0, Math.PI * 2)
						ctx.fill()
					}
				}

				ctx.shadowBlur = 0 // Reset
			})

		}, [nodes, edges, panX, panY, zoom, width, height, highlightDocumentIds])

		// Change-based rendering instead of continuous animation
		const lastRenderParams = useRef<string>("")

		// Create a render key that changes when visual state changes
		const renderKey = useMemo(() => {
			const nodePositions = nodes
				.map(
					(n) =>
						`${n.id}:${n.x}:${n.y}:${n.isDragging ? "1" : "0"}:${currentHoveredNode.current === n.id ? "1" : "0"}`,
				)
				.join("|")
			const highlightKey = (highlightDocumentIds ?? []).join("|")
			return `${nodePositions}-${edges.length}-${panX}-${panY}-${zoom}-${width}-${height}-${highlightKey}`
		}, [
			nodes,
			edges.length,
			panX,
			panY,
			zoom,
			width,
			height,
			highlightDocumentIds,
		])

		// Only render when something actually changed
		useEffect(() => {
			if (renderKey !== lastRenderParams.current) {
				lastRenderParams.current = renderKey
				render()
			}
		}, [renderKey, render])

		// Cleanup any existing animation frames
		useEffect(() => {
			return () => {
				if (animationRef.current) {
					cancelAnimationFrame(animationRef.current)
				}
			}
		}, [])

		// Add native wheel event listener to prevent browser zoom
		useEffect(() => {
			const canvas = canvasRef.current
			if (!canvas) return

			const handleNativeWheel = (e: WheelEvent) => {
				e.preventDefault()
				e.stopPropagation()

				// Call the onWheel handler with a synthetic-like event
				// @ts-expect-error - partial WheelEvent object
				onWheel({
					deltaY: e.deltaY,
					deltaX: e.deltaX,
					clientX: e.clientX,
					clientY: e.clientY,
					currentTarget: canvas,
					nativeEvent: e,
					preventDefault: () => { },
					stopPropagation: () => { },
				} as React.WheelEvent)
			}

			// Add listener with passive: false to ensure preventDefault works
			canvas.addEventListener("wheel", handleNativeWheel, { passive: false })

			// Also prevent gesture events for touch devices
			const handleGesture = (e: Event) => {
				e.preventDefault()
			}

			canvas.addEventListener("gesturestart", handleGesture, {
				passive: false,
			})
			canvas.addEventListener("gesturechange", handleGesture, {
				passive: false,
			})
			canvas.addEventListener("gestureend", handleGesture, { passive: false })

			return () => {
				canvas.removeEventListener("wheel", handleNativeWheel)
				canvas.removeEventListener("gesturestart", handleGesture)
				canvas.removeEventListener("gesturechange", handleGesture)
				canvas.removeEventListener("gestureend", handleGesture)
			}
		}, [onWheel])

		//  High-DPI handling  --------------------------------------------------
		const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

		useLayoutEffect(() => {
			const canvas = canvasRef.current
			if (!canvas) return

			// upscale backing store
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			canvas.width = width * dpr
			canvas.height = height * dpr

			const ctx = canvas.getContext("2d")
			ctx?.scale(dpr, dpr)
		}, [width, height, dpr])
		// -----------------------------------------------------------------------

		return (
			<canvas
				className={canvasWrapper}
				height={height}
				onClick={handleClick}
				onDoubleClick={onDoubleClick}
				onMouseDown={handleMouseDown}
				onMouseLeave={() => {
					if (draggingNodeId) {
						onNodeDragEnd()
					} else {
						onPanEnd()
					}
				}}
				onMouseMove={(e) => {
					handleMouseMove(e)
					if (!draggingNodeId) {
						onPanMove(e)
					}
				}}
				onMouseUp={() => {
					if (draggingNodeId) {
						onNodeDragEnd()
					} else {
						onPanEnd()
					}
				}}
				onTouchStart={onTouchStart}
				onTouchMove={onTouchMove}
				onTouchEnd={onTouchEnd}
				ref={canvasRef}
				style={{
					cursor: draggingNodeId
						? "grabbing"
						: currentHoveredNode.current
							? "grab"
							: "move",
					touchAction: "none",
					userSelect: "none",
					WebkitUserSelect: "none",
				}}
				width={width}
			/>
		)
	},
)

GraphCanvas.displayName = "GraphCanvas"
