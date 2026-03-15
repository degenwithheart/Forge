# Mobile Integration Examples

Complete examples of building mobile-friendly interfaces and features for FORGE.

## Table of Contents

- [Overview](#overview)
- [Mobile UI Components](#mobile-ui-components)
- [Touch Interactions](#touch-interactions)
- [Responsive Design](#responsive-design)
- [Mobile-Specific Features](#mobile-specific-features)
- [Performance Optimization](#performance-optimization)
- [PWA Integration](#pwa-integration)

## Overview

These examples demonstrate how to build mobile-optimized interfaces and features for FORGE, focusing on touch interactions, responsive design, and performance optimization for mobile devices.

### Mobile Design Principles

1. **Touch-First**: Large touch targets and gesture support
2. **Responsive**: Adapts to different screen sizes
3. **Performance**: Optimized for mobile hardware
4. **Battery-Friendly**: Efficient resource usage
5. **Offline Capable**: Works without internet connection

### Mobile Detection
```typescript
// Detect mobile device
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};
```

## Mobile UI Components

### Touch-Optimized Buttons
```typescript
// Mobile-friendly button component
const MobileButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'large',
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 active:scale-95';
  
  const sizeClasses = {
    small: 'px-3 py-2 text-sm min-h-[36px]',
    medium: 'px-4 py-3 text-base min-h-[44px]',
    large: 'px-6 py-4 text-lg min-h-[48px]'
  };
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };
  
  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed active:scale-100',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Usage
<MobileButton 
  size="large" 
  onClick={handleInference}
  disabled={!activeModel}
>
  {isGenerating ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <Send className="w-4 h-4 mr-2" />
      Run
    </>
  )}
</MobileButton>
```

### Swipeable Cards
```typescript
// Swipeable model cards for mobile
const SwipeableModelCard = ({ model, onLoad, isLoaded, isLoading }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  
  const handleTouchStart = (e) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const offset = currentX - startX.current;
    setSwipeOffset(offset);
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Check for swipe actions
    if (Math.abs(swipeOffset) > 100) {
      if (swipeOffset > 0) {
        // Swipe right - load model
        onLoad(model);
      } else {
        // Swipe left - unload model
        if (isLoaded) {
          onUnload(model);
        }
      }
    }
    
    setSwipeOffset(0);
  };
  
  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 shadow-sm transition-transform",
        isDragging && "shadow-lg"
      )}
      style={{
        transform: `translateX(${swipeOffset}px)`
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{model.name}</h3>
          <p className="text-xs text-muted-foreground">{model.author}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isLoaded ? "default" : "secondary"} className="text-xs">
            {isLoaded ? "Loaded" : "Available"}
          </Badge>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Badge variant="outline">{model.modality}</Badge>
        <span>~{estimateSize(model)}MB</span>
      </div>
      
      {model.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {model.description}
        </p>
      )}
      
      <div className="flex gap-2">
        <MobileButton 
          size="small" 
          className="flex-1"
          onClick={() => onLoad(model)}
          disabled={isLoading || isLoaded}
        >
          {isLoaded ? 'Loaded' : 'Load'}
        </MobileButton>
        
        {isLoaded && (
          <MobileButton 
            size="small"
            variant="outline"
            onClick={() => onUnload(model)}
          >
            Unload
          </MobileButton>
        )}
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground text-center">
        {isLoaded ? "← Swipe to unload" : "→ Swipe to load"}
      </div>
    </div>
  );
};
```

### Mobile Navigation
```typescript
// Bottom navigation for mobile
const MobileNavigation = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'output', label: 'Output', icon: MessageSquare },
    { id: 'models', label: 'Models', icon: Database },
    { id: 'params', label: 'Params', icon: Settings },
    { id: 'cache', label: 'Cache', icon: HardDrive },
    { id: 'providers', label: 'API', icon: Cloud }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

## Touch Interactions

### Gesture Recognition
```typescript
// Custom hook for gesture recognition
const useGestures = () => {
  const [gesture, setGesture] = useState(null);
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchEnd = useRef({ x: 0, y: 0, time: 0 });
  
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };
  
  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    recognizeGesture();
  };
  
  const recognizeGesture = () => {
    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    // Swipe detection
    if (distance > 50 && velocity > 0.3) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          setGesture('swipe-right');
        } else {
          setGesture('swipe-left');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          setGesture('swipe-down');
        } else {
          setGesture('swipe-up');
        }
      }
    }
    
    // Tap detection
    if (distance < 10 && deltaTime < 200) {
      setGesture('tap');
    }
    
    // Long press detection
    if (distance < 10 && deltaTime > 500) {
      setGesture('long-press');
    }
    
    // Clear gesture after a short delay
    setTimeout(() => setGesture(null), 100);
  };
  
  return {
    gesture,
    handleTouchStart,
    handleTouchEnd
  };
};

// Usage in component
const GestureComponent = () => {
  const { gesture, handleTouchStart, handleTouchEnd } = useGestures();
  
  useEffect(() => {
    if (gesture) {
      console.log('Gesture detected:', gesture);
      
      switch (gesture) {
        case 'swipe-up':
          // Open telemetry panel
          setTelemetryExpanded(true);
          break;
        case 'swipe-down':
          // Close telemetry panel
          setTelemetryExpanded(false);
          break;
        case 'swipe-left':
          // Go to next view
          navigateToNextView();
          break;
        case 'swipe-right':
          // Go to previous view
          navigateToPreviousView();
          break;
        case 'long-press':
          // Show context menu
          showContextMenu();
          break;
      }
    }
  }, [gesture]);
  
  return (
    <div
      className="w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Component content */}
    </div>
  );
};
```

### Pull to Refresh
```typescript
// Pull to refresh component
const PullToRefresh = ({ onRefresh, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  };
  
  const handleTouchMove = (e) => {
    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;
    
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 100));
      setIsPulling(true);
    }
  };
  
  const handleTouchEnd = () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh().finally(() => {
        setIsRefreshing(false);
      });
    }
    
    setIsPulling(false);
    setPullDistance(0);
  };
  
  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center bg-background border-b border-border transition-transform"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 60)}px)`,
          height: `${Math.max(0, pullDistance)}px`
        }}
      >
        {(isPulling || isRefreshing) && (
          <div className="flex items-center gap-2 p-2">
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            <span className="text-sm">
              {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Usage
<PullToRefresh onRefresh={() => refetchModels()}>
  <ModelList />
</PullToRefresh>
```

## Responsive Design

### Adaptive Layout
```typescript
// Responsive layout component
const ResponsiveLayout = ({ children }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <MobileHeader />
        <div className="flex-1 flex flex-col overflow-hidden">
          <MobileMainContent>
            {children}
          </MobileMainContent>
          <MobileNavigation />
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <DesktopHeader />
      <div className="flex-1 flex overflow-hidden">
        <DesktopSidebar>
          {children}
        </DesktopSidebar>
        <DesktopMainContent>
          {children}
        </DesktopMainContent>
        <DesktopTelemetry />
      </div>
    </div>
  );
};
```

### Responsive Grid
```typescript
// Responsive grid for model cards
const ResponsiveModelGrid = ({ models, children }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    // Single column on mobile
    return (
      <div className="space-y-3">
        {models.map(model => (
          <div key={model.id} className="w-full">
            {children(model)}
          </div>
        ))}
      </div>
    );
  }
  
  // Multi-column grid on desktop
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {models.map(model => (
        <div key={model.id}>
          {children(model)}
        </div>
      ))}
    </div>
  );
};
```

### Responsive Typography
```typescript
// Responsive text component
const ResponsiveText = ({ 
  children, 
  variant = 'body',
  className = '',
  ...props 
}) => {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl md:text-4xl font-bold',
    h2: 'text-xl sm:text-2xl md:text-3xl font-semibold',
    h3: 'text-lg sm:text-xl md:text-2xl font-medium',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm'
  };
  
  return (
    <p
      className={cn(
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

// Usage
<ResponsiveText variant="h1" className="text-center">
  FORGE Mobile Interface
</ResponsiveText>
```

## Mobile-Specific Features

### Camera Integration
```typescript
// Camera capture component
const CameraCapture = ({ onCapture, onError }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      onError('Camera access denied');
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };
  
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhoto(dataUrl);
      
      onCapture(dataUrl);
      stopCamera();
    }
  };
  
  return (
    <div className="space-y-4">
      {photo ? (
        <div className="space-y-4">
          <img src={photo} alt="Captured" className="w-full rounded-lg" />
          <MobileButton onClick={() => setPhoto(null)}>
            Retake Photo
          </MobileButton>
        </div>
      ) : (
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex gap-2">
            {!isStreaming ? (
              <MobileButton onClick={startCamera} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </MobileButton>
            ) : (
              <>
                <MobileButton onClick={capturePhoto} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </MobileButton>
                <MobileButton onClick={stopCamera} variant="outline">
                  <X className="w-4 h-4" />
                </MobileButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Voice Input
```typescript
// Voice input component
const VoiceInput = ({ onTranscript, onError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognition = useRef(null);
  
  const startRecording = () => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      
      recognition.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognition.current.onerror = (event) => {
        onError(`Speech recognition error: ${event.error}`);
        stopRecording();
      };
      
      recognition.current.onend = () => {
        setIsRecording(false);
        if (transcript) {
          onTranscript(transcript);
        }
      };
      
      recognition.current.start();
      setIsRecording(true);
    } else {
      onError('Speech recognition not supported');
    }
  };
  
  const stopRecording = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsRecording(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {transcript && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">{transcript}</p>
        </div>
      )}
      
      <MobileButton
        onClick={isRecording ? stopRecording : startRecording}
        variant={isRecording ? "destructive" : "outline"}
        className="w-full"
      >
        <Mic className="w-4 h-4 mr-2" />
        {isRecording ? 'Stop Recording' : 'Start Voice Input'}
      </MobileButton>
    </div>
  );
};
```

### Haptic Feedback
```typescript
// Haptic feedback utility
const useHaptics = () => {
  const vibrate = (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  
  const hapticPatterns = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [10, 50, 10],
    error: [100, 50, 100],
    notification: [25, 100, 25, 100],
    doubleTap: [10, 50, 10]
  };
  
  const triggerHaptic = (pattern) => {
    if (typeof pattern === 'string') {
      vibrate(hapticPatterns[pattern]);
    } else {
      vibrate(pattern);
    }
  };
  
  return { triggerHaptic, hapticPatterns };
};

// Usage in components
const HapticButton = ({ onClick, children, hapticFeedback = 'light', ...props }) => {
  const { triggerHaptic } = useHaptics();
  
  const handleClick = () => {
    triggerHaptic(hapticFeedback);
    onClick();
  };
  
  return (
    <MobileButton onClick={handleClick} {...props}>
      {children}
    </MobileButton>
  );
};
```

## Performance Optimization

### Lazy Loading
```typescript
// Lazy loading for mobile components
const LazyComponent = ({ component: Component, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={elementRef}>
      {isVisible ? <Component {...props} /> : <div className="animate-pulse bg-muted h-32 rounded-lg" />}
    </div>
  );
};

// Usage
<LazyComponent component={ModelCard} model={model} />
```

### Virtual Scrolling
```typescript
// Virtual scrolling for large lists on mobile
const VirtualList = ({ items, itemHeight = 60, containerHeight = 400 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return (
    <div
      ref={setContainerRef}
      className="overflow-y-auto"
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: (visibleStart + index) * itemHeight,
              width: '100%',
              height: itemHeight
            }}
          >
            <ModelCard model={item} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Image Optimization
```typescript
// Optimized image component for mobile
const OptimizedImage = ({ src, alt, className = '', ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(img);
    
    return () => observer.disconnect();
  }, [src]);
  
  return (
    <div className={cn('relative', className)}>
      {!isLoaded && !error && (
        <div className="animate-pulse bg-muted rounded-lg w-full h-32" />
      )}
      
      <img
        ref={imgRef}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-auto rounded-lg transition-opacity',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};
```

## PWA Integration

### Service Worker Registration
```typescript
// Service worker registration for PWA
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Call on app load
registerServiceWorker();
```

### Offline Support
```typescript
// Offline support component
const OfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center text-sm">
        You are offline. Some features may be unavailable.
      </div>
    );
  }
  
  return null;
};
```

### Install Prompt
```typescript
// PWA install prompt
const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };
  
  return { showInstallButton, handleInstall };
};

// Usage in component
const InstallPrompt = () => {
  const { showInstallButton, handleInstall } = useInstallPrompt();
  
  if (!showInstallButton) return null;
  
  return (
    <div className="fixed bottom-20 right-4">
      <MobileButton onClick={handleInstall} className="shadow-lg">
        <Download className="w-4 h-4 mr-2" />
        Install App
      </MobileButton>
    </div>
  );
};
```

---

These mobile integration examples provide a comprehensive foundation for building mobile-optimized interfaces and features for FORGE, ensuring excellent user experience on mobile devices.
