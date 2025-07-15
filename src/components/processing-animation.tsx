"use client";

import { cn } from "@/lib/utils";

export function ProcessingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center w-full max-w-md mx-auto py-12">
       <div className="w-48 h-36 relative processing-animation">
        {/* Completed Stack */}
        <div className="absolute top-0 right-0 w-24 h-32">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="doc-out absolute top-0 left-0 w-24 h-32 bg-card rounded-lg border shadow-sm"
              style={{
                animationDelay: `${i * -0.3}s`,
                // @ts-ignore
                "--y-offset": 5 - i,
              }}
            />
          ))}
        </div>

        {/* Pending Stack */}
        <div className="absolute top-4 left-0 w-24 h-32 overflow-hidden">
          <div className="doc-in w-full h-full">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 left-0 w-24 h-32 bg-card rounded-lg border shadow-sm"
                style={{ transform: `translateY(${i * 100}%)` }}
              />
            ))}
          </div>
        </div>

        {/* Scanner */}
        <div className="absolute top-4 left-0 w-24 h-32 rounded-lg overflow-hidden">
           <div className="scanner absolute top-0 left-0 w-full h-1 bg-primary/70 origin-left" />
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold font-headline">Analyzing Your Document...</h2>
      <p className="text-muted-foreground max-w-sm">
        Our AI is scanning the document, extracting questions, and looking for mathematical notation. This may take a few moments for larger files.
      </p>
    </div>
  );
}