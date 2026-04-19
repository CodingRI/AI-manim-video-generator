export default function Loading() {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0,1,2,3,4].map(i => (
              <div
                key={i}
                className="w-1 bg-[#7F77DD] rounded-full animate-pulse"
                style={{
                  height: `${16 + Math.sin(i) * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
  
          <p className="text-xs text-neutral-500 tracking-widest uppercase">
            loading
          </p>
        </div>
      </div>
    );
  }