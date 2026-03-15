# Mobile Usage Guide

Complete guide to using FORGE on mobile devices with the controller interface.

## Table of Contents

- [Overview](#overview)
- [Mobile Interface](#mobile-interface)
- [Navigation](#navigation)
- [Features](#features)
- [Touch Gestures](#touch-gestures)
- [Performance Optimization](#performance-optimization)
- [Mobile-Specific Features](#mobile-specific-features)
- [Troubleshooting](#troubleshooting)

## Overview

FORGE's mobile interface is designed as a "controller mode" that provides full functionality in a compact, touch-optimized layout. It's perfect for on-the-go testing, quick parameter adjustments, and field demos.

### Mobile vs Desktop

| Feature | Mobile (Controller) | Desktop (Studio) |
|---------|-------------------|------------------|
| Layout | Single column, swipe-based | Three-panel layout |
| Navigation | Tab-based, gesture-driven | Mouse/keyboard driven |
| Telemetry | Expandable panel | Always visible |
| Input | Touch-optimized | Keyboard-optimized |
| Focus | Quick operations | Detailed work |

### Responsive Design

FORGE automatically switches between mobile and desktop layouts based on screen width:
- **Mobile**: < 768px width
- **Desktop**: ≥ 768px width

## Mobile Interface

### Layout Structure

```
┌─────────────────────────┐
│ Header + View Switcher  │ ← Fixed top bar
├─────────────────────────┤
│    Output Stream        │ ← Main content area
│   (scrollable)          │
├─────────────────────────┤
│    Command Deck         │ ← Fixed input area
│  (Prompt + Tabs)        │
├─────────────────────────┤
│   Expandable Telemetry  │ ← Swipe-up panel
└─────────────────────────┘
```

### Header Bar

#### Components
```typescript
// Mobile header structure
<header className="flex items-center justify-between px-2 py-1.5 border-b">
  <div className="flex items-center gap-2">
    <span className="font-mono text-sm font-bold">FORGE</span>
    {activeModel && (
      <span className="text-xs text-primary truncate max-w-[120px]">
        {activeModel.name}
      </span>
    )}
  </div>
  
  <ViewSwitcher
    views={['output', 'models', 'settings', 'cache', 'providers']}
    activeView={currentView}
    onViewChange={setView}
  />
</header>
```

#### View Switcher Buttons
- **Out**: Output stream (default)
- **Lib**: Model library
- **Prm**: Parameter controls
- **Dsk**: Cache management
- **Api**: Provider settings

### Command Deck

#### Structure
```typescript
// Command deck with prompt input and controls
<div className="border-t bg-card">
  <div className="px-2 pt-2">
    <PromptInput
      onSubmit={handleInference}
      isGenerating={isGenerating}
      disabled={!activeModel}
      placeholder={activeModel ? `Prompt ${activeModel.name}...` : 'Load a model first'}
    />
  </div>
  
  <ExpandButton onClick={toggleTelemetry} />
  
  <ModalityTabs
    active={activeModality}
    onChange={setActiveModality}
    variant="mobile"
  />
  
  <TelemetryPanel expanded={telemetryExpanded} />
</div>
```

#### Features
- **Prompt Input**: Touch-optimized text input with send button
- **Expand Button**: Swipe-up gesture for telemetry
- **Modality Tabs**: Quick switching between model types
- **Telemetry Panel**: Collapsible metrics display

## Navigation

### Tab Navigation

#### Primary Views
```typescript
const mobileViews = [
  {
    id: 'output',
    label: 'Out',
    icon: MessageSquare,
    component: OutputStream
  },
  {
    id: 'models',
    label: 'Lib',
    icon: Database,
    component: ModelLibrary
  },
  {
    id: 'settings',
    label: 'Prm',
    icon: Settings,
    component: ParameterControls
  },
  {
    id: 'cache',
    label: 'Dsk',
    icon: HardDrive,
    component: CacheManagerSimple
  },
  {
    id: 'providers',
    label: 'Api',
    icon: Cloud,
    component: ProviderSettings
  }
];
```

#### Navigation Patterns
- **Single Tap**: Switch between views
- **Long Press**: Show context menu (if available)
- **Swipe**: Navigate within scrollable content

### Content Navigation

#### Model Library
```typescript
// Mobile model library navigation
const MobileModelLibrary = () => {
  return (
    <div className="p-3 space-y-3">
      <SearchInput
        placeholder="Search models..."
        value={searchQuery}
        onChange={setSearchQuery}
        compact={true}
      />
      
      <ModalityTabs
        active={activeModality}
        onChange={setActiveModality}
        variant="mobile"
      />
      
      <div className="space-y-2">
        {filteredModels.map(model => (
          <MobileModelCard
            key={model.modelId}
            model={model}
            onLoad={handleModelLoad}
            isLoaded={loadedModels.has(model.modelId)}
            isLoading={loadingModels.has(model.modelId)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### Parameter Controls
```typescript
// Mobile parameter controls layout
const MobileParameterControls = () => {
  return (
    <div className="p-3 space-y-4">
      <ParameterSlider
        label="Temperature"
        value={params.temperature}
        onChange={(value) => updateParams({ temperature: value })}
        min={0}
        max={2}
        step={0.1}
        compact={true}
      />
      
      <ParameterSlider
        label="Top-P"
        value={params.topP}
        onChange={(value) => updateParams({ topP: value })}
        min={0}
        max={1}
        step={0.05}
        compact={true}
      />
      
      <ParameterSlider
        label="Max Tokens"
        value={params.maxTokens}
        onChange={(value) => updateParams({ maxTokens: value })}
        min={1}
        max={1024}
        step={1}
        compact={true}
      />
      
      <ResetButton onClick={resetToDefaults} compact={true} />
    </div>
  );
};
```

## Features

### Output Stream

#### Mobile-Optimized Display
```typescript
const MobileOutputStream = () => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {results.map((result, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{result.provider}</Badge>
            <span>{formatTime(result.timestamp)}</span>
            {result.tokens && (
              <span>{result.tokens} tokens</span>
            )}
          </div>
          
          <div className="text-sm leading-relaxed">
            {result.type === 'image' ? (
              <img src={result.content} alt="Generated" className="rounded-lg" />
            ) : (
              <p>{result.content}</p>
            )}
          </div>
        </div>
      ))}
      
      {isGenerating && streamingText && (
        <StreamingText text={streamingText} />
      )}
    </div>
  );
};
```

#### Features
- **Compact Display**: Optimized for small screens
- **Token Count**: Shows token usage
- **Provider Badge**: Identifies which provider was used
- **Timestamp**: Shows when response was generated
- **Streaming**: Real-time text generation display

### Model Cards

#### Touch-Optimized Design
```typescript
const MobileModelCard = ({ model, onLoad, isLoaded, isLoading }) => {
  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{model.name}</h3>
          <p className="text-xs text-muted-foreground">{model.author}</p>
        </div>
        
        <ModelStatusBadge
          isLoaded={isLoaded}
          isLoading={isLoading}
          compact={true}
        />
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{model.modality}</Badge>
        <span>~{estimateSize(model)}MB</span>
      </div>
      
      <LoadButton
        model={model}
        onLoad={onLoad}
        isLoaded={isLoaded}
        isLoading={isLoading}
        compact={true}
      />
    </div>
  );
};
```

#### Touch Targets
- **Minimum Size**: 44px × 44px touch targets
- **Spacing**: Adequate spacing between interactive elements
- **Feedback**: Visual and haptic feedback on touch

### Parameter Controls

#### Slider Controls
```typescript
const MobileParameterSlider = ({ label, value, onChange, min, max, step }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};
```

#### Mobile-Specific Features
- **Large Touch Targets**: Easy to adjust with thumb
- **Live Value Display**: Shows current value
- **Snap to Values**: Optional snap to common values
- **Haptic Feedback**: Vibration on value change (if supported)

## Touch Gestures

### Swipe Gestures

#### Telemetry Panel
```typescript
const useSwipeGestures = () => {
  const [telemetryExpanded, setTelemetryExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  
  const handleTouchStart = (e: TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    
    // Swipe up to expand
    if (deltaY > 50 && !telemetryExpanded) {
      setTelemetryExpanded(true);
    }
    
    // Swipe down to collapse
    if (deltaY < -50 && telemetryExpanded) {
      setTelemetryExpanded(false);
    }
  };
  
  return {
    telemetryExpanded,
    setTelemetryExpanded,
    handleTouchStart,
    handleTouchMove
  };
};
```

#### Scroll Navigation
```typescript
const useScrollNavigation = () => {
  const listRef = useRef(null);
  
  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  };
  
  return {
    listRef,
    scrollToTop,
    scrollToBottom
  };
};
```

### Tap Gestures

#### Double Tap
```typescript
const useDoubleTap = () => {
  const [lastTap, setLastTap] = useState(0);
  
  const handleDoubleTap = (callback: () => void) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;
    
    if (timeSinceLastTap < 300) {
      callback();
    }
    
    setLastTap(now);
  };
  
  return handleDoubleTap;
};
```

#### Long Press
```typescript
const useLongPress = () => {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const startPress = (callback: () => void) => {
    setPressTimer(setTimeout(callback, 500));
  };
  
  const cancelPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };
  
  return {
    startPress,
    cancelPress
  };
};
```

## Performance Optimization

### Mobile Performance

#### Lazy Loading
```typescript
const useLazyLoading = () => {
  const [visibleItems, setVisibleItems] = useState(10);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems(prev => prev + 10);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  return { visibleItems, observerRef };
};
```

#### Virtual Scrolling
```typescript
const VirtualizedList = ({ items, itemHeight, containerHeight }) => {
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
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: (visibleStart + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            <ListItem item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Memory Management

#### Component Unmounting
```typescript
const MobileView = () => {
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cancelPendingRequests();
      clearTimers();
      disposeEventListeners();
    };
  }, []);
  
  return <div>{/* Component content */}</div>;
};
```

#### Image Optimization
```typescript
const OptimizedImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className={className}>
      {!loaded && !error && (
        <div className="animate-pulse bg-muted rounded-lg h-32" />
      )}
      
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-auto rounded-lg ${loaded ? 'block' : 'hidden'}`}
      />
      
      {error && (
        <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Failed to load</span>
        </div>
      )}
    </div>
  );
};
```

## Mobile-Specific Features

### Haptic Feedback

#### Vibration API
```typescript
const useHapticFeedback = () => {
  const vibrate = (pattern: number | number[]) => {
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
    notification: [25, 100, 25, 100]
  };
  
  return {
    vibrate,
    hapticPatterns
  };
};
```

#### Usage Examples
```typescript
const { vibrate, hapticPatterns } = useHapticFeedback();

// On model load success
vibrate(hapticPatterns.success);

// On error
vibrate(hapticPatterns.error);

// On parameter change
vibrate(hapticPatterns.light);
```

### Camera Integration

#### Image Input
```typescript
const MobileImageInput = ({ onImageSelect }) => {
  const fileInputRef = useRef(null);
  
  const handleImageSelect = (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      // Use camera API
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // Handle camera stream
        })
        .catch(err => {
          console.error('Camera access denied:', err);
        });
    } else {
      // Use file picker
      fileInputRef.current?.click();
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => handleImageSelect('camera')}>
          <Camera className="w-4 h-4 mr-2" />
          Camera
        </Button>
        <Button onClick={() => handleImageSelect('gallery')}>
          <Image className="w-4 h-4 mr-2" />
          Gallery
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => onImageSelect(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};
```

### Share Integration

#### Web Share API
```typescript
const useWebShare = () => {
  const share = async (title: string, text: string, url?: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to copying to clipboard
      copyToClipboard(text);
    }
  };
  
  return { share };
};
```

#### Usage in FORGE
```typescript
const ShareResults = ({ results }) => {
  const { share } = useWebShare();
  
  const handleShare = async () => {
    const text = results.map(r => r.content).join('\n\n');
    await share('FORGE Results', text);
  };
  
  return (
    <Button onClick={handleShare} variant="outline" size="sm">
      <Share2 className="w-4 h-4 mr-2" />
      Share
    </Button>
  );
};
```

## Troubleshooting

### Common Mobile Issues

#### Touch Events Not Working
```typescript
// Ensure touch events are properly handled
const TouchableComponent = () => {
  const handleTouch = (e: TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    // Handle touch logic
  };
  
  return (
    <div
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouch}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Content */}
    </div>
  );
};
```

#### Viewport Issues
```typescript
// Ensure proper viewport meta tag
const MobileViewport = () => {
  useEffect(() => {
    // Add viewport meta tag if not present
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);
  
  return null;
};
```

#### Keyboard Issues
```typescript
// Handle virtual keyboard
const useVirtualKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    const handleResize = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const keyboardHeight = window.innerHeight - viewport.height;
        setKeyboardHeight(keyboardHeight);
      }
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return { keyboardHeight };
};
```

### Performance Issues

#### Slow Rendering
```typescript
// Optimize rendering with React.memo
const OptimizedComponent = React.memo(({ data }) => {
  return (
    <div>
      {/* Render content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

#### Memory Leaks
```typescript
// Proper cleanup of event listeners
const useEventListener = (event, handler, element = window) => {
  useEffect(() => {
    element.addEventListener(event, handler);
    
    return () => {
      element.removeEventListener(event, handler);
    };
  }, [event, handler, element]);
};
```

### Browser Compatibility

#### iOS Safari
```typescript
// iOS Safari specific fixes
const iOSSafariFixes = () => {
  useEffect(() => {
    // Fix viewport height issues
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);
};
```

#### Android Chrome
```typescript
// Android Chrome specific fixes
const androidChromeFixes = () => {
  useEffect(() => {
    // Fix scroll issues
    if (navigator.userAgent.includes('Android')) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
};
```

---

This guide covers all aspects of mobile usage in FORGE. The mobile interface provides full functionality while being optimized for touch interactions and mobile performance.
