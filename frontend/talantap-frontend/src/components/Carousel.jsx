import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Carousel = ({ items, itemsPerView = 3, gap = 24 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Calculate the maximum index we can scroll to
  const maxIndex = Math.max(0, items.length - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
  };

  // Calculate transform based on current index
  const translateValue = currentIndex * (100 / itemsPerView);

  return (
    <div className="relative w-full py-8">
      {/* Carousel Container */}
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${translateValue}%)`,
            gap: `${gap}px`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 transform transition-all duration-300 hover:scale-105"
              style={{
                width: `calc(${100 / itemsPerView}% - ${(gap * (itemsPerView - 1)) / itemsPerView}px)`,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-3 shadow-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 z-20 border-4 border-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {currentIndex < maxIndex && (
        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-3 shadow-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 z-20 border-4 border-white"
          aria-label="Next slide"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Dots Indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-3 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 w-10 h-3 shadow-md'
                  : 'bg-blue-200 hover:bg-blue-300 w-3 h-3'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
