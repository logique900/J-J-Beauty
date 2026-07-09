const fs = require('fs');
let code = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');

const t = `      {slides.length > 1 && (
        <>
          {/* Navigation Controls */}
          <div className="absolute right-6 md:right-12 bottom-24 flex items-center gap-4">
            <button 
              onClick={prevSlide} 
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all duration-300 backdrop-blur-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
            
            <button 
              onClick={nextSlide} 
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all duration-300 backdrop-blur-sm"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 -mr-0.5" />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute top-1/2 -translate-y-1/2 right-6 md:right-12 flex flex-col gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={\`w-1 transition-all duration-500 \${current === idx ? 'h-12 bg-white' : 'h-3 bg-white/30 hover:bg-white/60'}\`}
                aria-label={\`Go to slide \${idx + 1}\`}
              />
            ))}
          </div>
        </>
      )}`;

const r = `      {slides.length > 1 && (
        <>
          {/* Navigation Controls - Left/Right edges */}
          <div className="absolute inset-y-0 left-4 md:left-8 flex items-center">
            <button 
              onClick={prevSlide} 
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 -ml-0.5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-4 md:right-8 flex items-center">
            <button 
              onClick={nextSlide} 
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 -mr-0.5" />
            </button>
          </div>

          {/* Indicators - Bottom center */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={\`h-1 transition-all duration-500 rounded-full \${current === idx ? 'w-12 bg-white' : 'w-3 bg-white/30 hover:bg-white/60'}\`}
                aria-label={\`Go to slide \${idx + 1}\`}
              />
            ))}
          </div>
        </>
      )}`;

if (code.includes(t)) {
    code = code.replace(t, r);
    fs.writeFileSync('src/components/HeroSection.tsx', code);
    console.log("Patched controls successfully");
} else {
    console.log("Could not find target content in HeroSection.tsx");
}
