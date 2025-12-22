import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { tooltipArrow, tooltipContent } from "./tooltip.css"

export function TooltipProvider({
    children,
    ...props
}: TooltipPrimitive.TooltipProviderProps) {
    return (
        <TooltipPrimitive.Provider delayDuration={0} {...props}>
            {children}
        </TooltipPrimitive.Provider>
    )
}

export function Tooltip({ children, ...props }: TooltipPrimitive.TooltipProps) {
    return (
        <TooltipProvider>
            <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
        </TooltipProvider>
    )
}

export function TooltipTrigger({
    children,
    ...props
}: TooltipPrimitive.TooltipTriggerProps) {
    return <TooltipPrimitive.Trigger {...props}>{children}</TooltipPrimitive.Trigger>
}

export function TooltipContent({
    children,
    sideOffset = 5,
    ...props
}: TooltipPrimitive.TooltipContentProps) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                className={tooltipContent}
                sideOffset={sideOffset}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow className={tooltipArrow} />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    )
}
