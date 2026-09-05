"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextType | null>(null);

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Popover({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLDivElement, PopoverTriggerProps>(
  ({ children, className, onClick, asChild = false, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    if (!context) {
      throw new Error("PopoverTrigger must be used within a Popover");
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      context.setOpen(!context.open);
    };

    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        ref={ref}
        onClick={handleClick}
        className={cn("inline-flex cursor-pointer", className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      className,
      align = "center",
      side = "bottom",
      children,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(PopoverContext);

    if (!context?.open) return null;

    let positionClasses = "";
    if (side === "top") {
      positionClasses = "bottom-full mb-2 ";
      if (align === "end") positionClasses += "right-0";
      else if (align === "start") positionClasses += "left-0";
      else positionClasses += "left-1/2 -translate-x-1/2";
    } else {
      positionClasses = "top-full mt-2 ";
      if (align === "end") positionClasses += "right-0";
      else if (align === "start") positionClasses += "left-0";
      else positionClasses += "left-1/2 -translate-x-1/2";
    }

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
          positionClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = "PopoverContent";
