import { useState, useEffect, useRef } from 'react';
import type { ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    placeholderSrc?: string;
    threshold?: number;
    rootMargin?: string;
}

/**
 * Lazy-loaded image component using Intersection Observer
 * Only loads the image when it enters the viewport
 */
export function LazyImage({
    src,
    alt,
    placeholderSrc,
    threshold = 0.1,
    rootMargin = '100px',
    className,
    ...props
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <img
            ref={imgRef}
            src={isInView ? src : placeholderSrc || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={alt}
            loading="lazy"
            onLoad={handleLoad}
            className={`${className || ''} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            {...props}
        />
    );
}

export default LazyImage;
