import React from 'react';
import Image from "next/image";
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    large?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, large = false }) => {
    return (
        <div className={cn("flex items-center gap-4 select-none", className)}>
            <div className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-2xl",
                large ? "h-20 w-20" : "h-12 w-12"
            )}>
                <Image
                    src="/logo.webp"
                    alt="Logo Value"
                    width={large ? 68 : 42}
                    height={large ? 68 : 42}
                    sizes={large ? "80px" : "48px"}
                    className="relative z-10 object-contain drop-shadow-md"
                    priority={large}
                />
            </div>
            <div className="flex flex-col leading-none">
                <span className={cn(
                    "bg-gradient-to-b from-white to-white/80 bg-clip-text font-black tracking-tight text-transparent drop-shadow-sm",
                    large ? "text-[3.2rem]" : "text-[1.85rem]"
                )}>
                    Value
                </span>
                <span className={cn(
                    "font-bold uppercase text-[#ff6a1a] flex w-full justify-between",
                    large ? "text-[0.98rem]" : "text-[0.58rem]"
                )}>
                    {"Educação".split("").map((char, i) => (
                        <span key={i}>{char}</span>
                    ))}
                </span>
            </div>
        </div>
    );
};
