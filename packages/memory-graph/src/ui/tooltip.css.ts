import { style, keyframes } from "@vanilla-extract/css"
import { themeContract } from "../styles/theme.css"

const slideUpAndFade = keyframes({
    "0%": { opacity: 0, transform: "translateY(2px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
})

const slideRightAndFade = keyframes({
    "0%": { opacity: 0, transform: "translateX(-2px)" },
    "100%": { opacity: 1, transform: "translateX(0)" },
})

const slideDownAndFade = keyframes({
    "0%": { opacity: 0, transform: "translateY(-2px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
})

const slideLeftAndFade = keyframes({
    "0%": { opacity: 0, transform: "translateX(2px)" },
    "100%": { opacity: 1, transform: "translateX(0)" },
})

export const tooltipContent = style({
    borderRadius: themeContract.radii.md,
    padding: `${themeContract.space[2]} ${themeContract.space[3]}`,
    fontSize: themeContract.typography.fontSize.xs,
    lineHeight: "1",
    color: themeContract.colors.text.primary,
    backgroundColor: themeContract.colors.background.secondary,
    border: `1px solid ${themeContract.colors.document.border}`,
    backdropFilter: "blur(4px)",
    boxShadow: `0 2px 10px ${themeContract.colors.connection.strong}`,
    userSelect: "none",
    animationDuration: "400ms",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "transform, opacity",
    zIndex: themeContract.zIndex.tooltip,
    selectors: {
        '&[data-state="delayed-open"][data-side="top"]': {
            animationName: slideDownAndFade,
        },
        '&[data-state="delayed-open"][data-side="right"]': {
            animationName: slideLeftAndFade,
        },
        '&[data-state="delayed-open"][data-side="bottom"]': {
            animationName: slideUpAndFade,
        },
        '&[data-state="delayed-open"][data-side="left"]': {
            animationName: slideRightAndFade,
        },
    },
})

export const tooltipArrow = style({
    fill: themeContract.colors.background.secondary,
})
