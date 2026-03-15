# Desktop Usage Guide

Complete guide to using FORGE on desktop with the studio interface.

## Table of Contents

- [Overview](#overview)
- [Desktop Interface](#desktop-interface)
- [Layout Components](#layout-components)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Mouse Interactions](#mouse-interactions)
- [Multi-Monitor Support](#multi-monitor-support)
- [Desktop Features](#desktop-features)
- [Troubleshooting](#troubleshooting)

## Overview

FORGE's desktop interface is designed as a "studio mode" that provides comprehensive access to all features in a professional, three-panel layout optimized for extended work sessions and detailed model development.

### Desktop vs Mobile

| Feature | Desktop (Studio) | Mobile (Controller) |
|---------|------------------|-------------------|
| Layout | Three-panel fixed layout | Single column, swipe-based |
| Navigation | Mouse/keyboard driven | Touch-optimized |
| Telemetry | Always visible | Expandable panel |
| Input | Full keyboard support | Touch-optimized |
| Focus | Detailed work | Quick operations |

### Responsive Design

FORGE automatically switches between desktop and mobile layouts based on screen width:
- **Desktop**: ≥ 768px width
- **Mobile**: < 768px width

## Desktop Interface

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Header Bar                            │ ← Fixed top
├─────────┬───────────────────────┬───────────────────────┤
│ Model   │   Prompt + Output      │    Telemetry Panel    │ ← Main
│ Library │                       │                       │ │ Content
│ (280px) │   Main Stage           │     (240px)           │ │ Area
│         │                       │                       │ │
│ Modality│   Output Stream        │   Hardware Metrics    │ │
│ Tabs    │   Prompt Input         │   Parameter Controls  │ │
│         │   Generation Status    │   Provider Status    │ │
│ Search  │                       │   Model Status        │ │
│ Filter  │                       │   Performance Stats   │ │
└─────────┴───────────────────────┴───────────────────────┘
```

### Header Bar

#### Components
```typescript
// Desktop header structure
<header className="flex items-center justify-between px-4 py-2 border-b bg-background">
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <Cpu className="w-5 h-5 text-primary" />
      <span className="font-mono text-lg font-bold">FORGE</span>
    </div>
    
    {activeModel && (
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline">{activeModel.modality}</Badge>
        <span className="font-medium">{activeModel.name}</span>
        <Badge variant={loadedModels.has(activeModel.modelId) ? "default" : "secondary"}>
          {loadedModels.has(activeModel.modelId) ? "Loaded" : "Available"}
        </Badge>
      </div>
    )}
  </div>
  
  <div className="flex items-center gap-2">
    <ThemeToggle />
    <SettingsButton />
    <HelpButton />
  </div>
</header>
```

#### Features
- **Brand Identity**: FORGE logo and branding
- **Model Status**: Current model and loading status
- **Quick Actions**: Theme toggle, settings, help
- **System Status**: Connection status indicators

## Layout Components

### Model Library (Left Panel)

#### Structure
```typescript
const ModelLibrary = () => {
  return (
    <div className="w-[280px] border-r bg-card flex flex-col">
      <div className="p-3 border-b">
        <SearchInput
          placeholder="Search models..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full"
        />
        
        <ModalityTabs
          active={activeModality}
          onChange={setActiveModality}
          className="mt-2"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredModels.map(model => (
          <ModelCard
            key={model.modelId}
            model={model}
            onLoad={handleModelLoad}
            onUnload={handleModelUnload}
            isLoaded={loadedModels.has(model.modelId)}
            isLoading={loadingModels.has(model.modelId)}
          />
        ))}
      </div>
      
      <div className="p-3 border-t">
        <LibraryStats stats={libraryStats} />
      </div>
    </div>
  );
};
```

#### Features
- **Search**: Real-time model search
- **Modality Tabs**: Filter by model type
- **Model Cards**: Detailed model information
- **Library Stats**: Model count and storage usage
- **Fixed Width**: 280px for consistent layout

#### Model Cards
```typescript
const ModelCard = ({ model, onLoad, onUnload, isLoaded, isLoading }) => {
  return (
    <Card className="p-3 space-y-3 hover:bg-accent/50 transition-colors">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight">{model.name}</h3>
            <p className="text-xs text-muted-foreground">{model.author}</p>
          </div>
          
          <ModelStatusBadge
            isLoaded={isLoaded}
            isLoading={isLoading}
          />
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{model.modality}</Badge>
          <span>~{estimateSize(model)}MB</span>
          {model.downloads && (
            <span>{formatNumber(model.downloads)} downloads</span>
          )}
        </div>
        
        {model.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {model.description}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        {isLoaded ? (
          <Button
            onClick={() => onUnload(model)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Unload
          </Button>
        ) : (
          <Button
            onClick={() => onLoad(model)}
            disabled={isLoading}
            size="sm"
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Download className="w-3 h-3 mr-1" />
            )}
            {isLoading ? 'Loading...' : 'Load'}
          </Button>
        )}
        
        <Button
          onClick={() => showModelDetails(model)}
          variant="ghost"
          size="sm"
        >
          <Info className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};
```

### Main Stage (Center Panel)

#### Structure
```typescript
const MainStage = () => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <OutputStream />
      </div>
      
      <div className="border-t bg-card p-4">
        <PromptInput
          onSubmit={handleInference}
          isGenerating={isGenerating}
          disabled={!activeModel}
          placeholder={activeModel ? `Prompt ${activeModel.name}...` : 'Load a model first'}
        />
        
        <GenerationControls
          isGenerating={isGenerating}
          onCancel={cancelInference}
          onRetry={retryInference}
          className="mt-2"
        />
      </div>
    </div>
  );
};
```

#### Output Stream
```typescript
const OutputStream = () => {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline">{result.provider}</Badge>
            <span>{formatTime(result.timestamp)}</span>
            {result.tokens && (
              <span>{result.tokens} tokens</span>
            )}
            {result.duration && (
              <span>{(result.duration / 1000).toFixed(1)}s</span>
            )}
            {result.tps && (
              <span>{result.tps.toFixed(1)} t/s</span>
            )}
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            {result.type === 'image' ? (
              <img src={result.content} alt="Generated" className="rounded-lg max-w-full" />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {result.content}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <CopyButton content={result.content} />
            <ShareButton result={result} />
            <SaveButton result={result} />
            <RegenerateButton prompt={result.prompt} />
          </div>
        </div>
      ))}
      
      {isGenerating && streamingText && (
        <StreamingText text={streamingText} />
      )}
      
      {results.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No results yet"
          description="Load a model and start generating content to see results here."
        />
      )}
    </div>
  );
};
```

#### Prompt Input
```typescript
const PromptInput = ({ onSubmit, isGenerating, disabled, placeholder }) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);
  
  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating && !disabled) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isGenerating}
        className="min-h-[80px] resize-none"
        rows={3}
      />
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {prompt.length} characters • {estimateTokens(prompt)} tokens
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setPrompt('')}
            variant="outline"
            size="sm"
            disabled={!prompt}
          >
            Clear
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating || disabled}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Send className="w-3 h-3 mr-1" />
            )}
            {isGenerating ? 'Generating...' : 'Run'}
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### Telemetry Panel (Right Panel)

#### Structure
```typescript
const TelemetryPanel = () => {
  return (
    <div className="w-[240px] border-l bg-card flex flex-col">
      <div className="p-3 border-b">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Telemetry
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <HardwareMetrics />
        <ModelStatus />
        <ParameterControls />
        <ProviderStatus />
        <PerformanceStats />
      </div>
    </div>
  );
};
```

#### Hardware Metrics
```typescript
const HardwareMetrics = () => {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Hardware
      </h4>
      
      <div className="space-y-2">
        <MetricBar
          label="VRAM"
          value={telemetry.vramUsed}
          max={telemetry.vramTotal}
          unit="MB"
          color="blue"
        />
        
        <MetricBar
          label="CPU"
          value={telemetry.cpuUsage * 100}
          max={100}
          unit="%"
          color="green"
        />
        
        <MetricBar
          label="GPU"
          value={telemetry.gpuUsage * 100}
          max={100}
          unit="%"
          color="purple"
        />
      </div>
    </div>
  );
};
```

#### Parameter Controls
```typescript
const DesktopParameterControls = () => {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Parameters
      </h4>
      
      <div className="space-y-3">
        <ParameterSlider
          label="Temperature"
          value={params.temperature}
          onChange={(value) => updateParams({ temperature: value })}
          min={0}
          max={2}
          step={0.1}
        />
        
        <ParameterSlider
          label="Top-P"
          value={params.topP}
          onChange={(value) => updateParams({ topP: value })}
          min={0}
          max={1}
          step={0.05}
        />
        
        <ParameterSlider
          label="Max Tokens"
          value={params.maxTokens}
          onChange={(value) => updateParams({ maxTokens: value })}
          min={1}
          max={4096}
          step={1}
        />
        
        <ParameterSlider
          label="Context Window"
          value={params.contextWindow}
          onChange={(value) => updateParams({ contextWindow: value })}
          min={512}
          max={32768}
          step={512}
        />
        
        <Button
          onClick={resetToDefaults}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};
```

## Keyboard Shortcuts

### Global Shortcuts

#### Navigation
```typescript
const keyboardShortcuts = {
  // Navigation
  'Ctrl+K': 'Focus search',
  'Ctrl+1': 'Switch to Text modality',
  'Ctrl+2': 'Switch to Image modality',
  'Ctrl+3': 'Switch to Audio modality',
  'Ctrl+4': 'Switch to Video modality',
  
  // Model operations
  'Ctrl+L': 'Load selected model',
  'Ctrl+U': 'Unload selected model',
  'Ctrl+Shift+L': 'Load all models',
  'Ctrl+Shift+U': 'Unload all models',
  
  // Inference
  'Ctrl+Enter': 'Run inference',
  'Ctrl+Shift+Enter': 'Run inference with current parameters',
  'Escape': 'Cancel inference',
  'Ctrl+R': 'Retry last inference',
  
  // UI
  'Ctrl+T': 'Toggle theme',
  'Ctrl+H': 'Toggle help',
  'Ctrl+S': 'Save current results',
  'Ctrl+Shift+S': 'Export results',
  
  // Search
  'Ctrl+F': 'Find in results',
  'Ctrl+Shift+F': 'Search models',
  'F3': 'Find next',
  'Shift+F3': 'Find previous'
};
```

#### Implementation
```typescript
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for our shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            focusSearch();
            break;
          case 'Enter':
            e.preventDefault();
            runInference();
            break;
          case 'l':
            e.preventDefault();
            if (e.shiftKey) {
              loadAllModels();
            } else {
              loadSelectedModel();
            }
            break;
          // Add more shortcuts...
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### Context-Specific Shortcuts

#### Model Library
```typescript
const modelLibraryShortcuts = {
  '↑/↓': 'Navigate models',
  'Enter': 'Load selected model',
  'Space': 'Toggle model selection',
  'Delete': 'Unload selected model',
  'Ctrl+A': 'Select all models',
  'Ctrl+C': 'Copy model info',
  'Ctrl+I': 'Show model details'
};
```

#### Prompt Input
```typescript
const promptInputShortcuts = {
  'Ctrl+Enter': 'Submit prompt',
  'Shift+Enter': 'New line',
  'Ctrl+L': 'Clear input',
  'Ctrl+Z': 'Undo',
  'Ctrl+Y': 'Redo',
  'Ctrl+A': 'Select all',
  'Tab': 'Auto-complete'
};
```

## Mouse Interactions

### Click Actions

#### Model Cards
```typescript
const ModelCard = ({ model, onClick, onDoubleClick }) => {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onClick(model)}
      onDoubleClick={() => onDoubleClick(model)}
    >
      {/* Card content */}
    </Card>
  );
};
```

#### Right-Click Context Menu
```typescript
const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState(null);
  
  const handleContextMenu = (e: MouseEvent, item: any) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  };
  
  const closeContextMenu = () => {
    setContextMenu(null);
  };
  
  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu
  };
};
```

### Drag and Drop

#### Model Reordering
```typescript
const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  
  const handleDragStart = (e: DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: DragEvent, targetItem: any) => {
    e.preventDefault();
    // Handle reordering logic
    reorderItems(draggedItem, targetItem);
    setDraggedItem(null);
  };
  
  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop
  };
};
```

#### File Upload
```typescript
const useFileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };
  
  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
};
```

## Multi-Monitor Support

### Window Management

#### Panel Detaching
```typescript
const useDetachablePanels = () => {
  const [detachedPanels, setDetachedPanels] = useState(new Set());
  
  const detachPanel = (panelId: string) => {
    const panel = getPanelById(panelId);
    const newWindow = window.open('', panelId, 'width=400,height=600');
    
    if (newWindow) {
      // Move panel content to new window
      renderPanelInWindow(newWindow, panel);
      setDetachedPanels(prev => new Set(prev).add(panelId));
    }
  };
  
  const attachPanel = (panelId: string) => {
    // Close detached window and restore panel
    const detachedWindow = getDetachedWindow(panelId);
    if (detachedWindow) {
      detachedWindow.close();
      setDetachedPanels(prev => {
        const newSet = new Set(prev);
        newSet.delete(panelId);
        return newSet;
      });
    }
  };
  
  return {
    detachedPanels,
    detachPanel,
    attachPanel
  };
};
```

#### Full Screen Mode
```typescript
const useFullScreen = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullScreen(false);
    }
  };
  
  return {
    isFullScreen,
    toggleFullScreen
  };
};
```

## Desktop Features

### Advanced Search

#### Search Filters
```typescript
const AdvancedSearch = () => {
  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search models..."
        value={searchQuery}
        onChange={setSearchQuery}
      />
      
      <div className="grid grid-cols-2 gap-2">
        <Select value={modalityFilter} onValueChange={setModalityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Modality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modalities</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="huggingface">HuggingFace</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <RangeSlider
        label="Size Range"
        value={sizeRange}
        onChange={setSizeRange}
        min={0}
        max={10000}
        step={100}
        unit="MB"
      />
      
      <CheckboxGroup
        label="Features"
        options={[
          { label: 'Quantized', value: 'quantized' },
          { label: 'Fine-tuned', value: 'fine-tuned' },
          { label: 'Popular', value: 'popular' },
          { label: 'New', value: 'new' }
        ]}
        value={featureFilters}
        onChange={setFeatureFilters}
      />
    </div>
  );
};
```

### Batch Operations

#### Multi-Select
```typescript
const useMultiSelect = () => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  const toggleSelection = (item: any) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(item.id)) {
      newSelection.delete(item.id);
    } else {
      newSelection.add(item.id);
    }
    setSelectedItems(newSelection);
  };
  
  const selectAll = () => {
    const allIds = items.map(item => item.id);
    setSelectedItems(new Set(allIds));
  };
  
  const clearSelection = () => {
    setSelectedItems(new Set());
  };
  
  return {
    selectedItems,
    isMultiSelectMode,
    setIsMultiSelectMode,
    toggleSelection,
    selectAll,
    clearSelection
  };
};
```

#### Batch Actions
```typescript
const BatchActions = ({ selectedItems }) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={() => batchLoad(selectedItems)}
        disabled={selectedItems.size === 0}
        size="sm"
      >
        <Download className="w-3 h-3 mr-1" />
        Load Selected ({selectedItems.size})
      </Button>
      
      <Button
        onClick={() => batchUnload(selectedItems)}
        disabled={selectedItems.size === 0}
        variant="outline"
        size="sm"
      >
        <Trash2 className="w-3 h-3 mr-1" />
        Unload Selected
      </Button>
      
      <Button
        onClick={() => batchExport(selectedItems)}
        disabled={selectedItems.size === 0}
        variant="outline"
        size="sm"
      >
        <Download className="w-3 h-3 mr-1" />
        Export Info
      </Button>
    </div>
  );
};
```

### Data Export

#### Results Export
```typescript
const ExportResults = ({ results, format }) => {
  const exportData = () => {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (format) {
      case 'json':
        content = JSON.stringify(results, null, 2);
        filename = `forge-results-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
        
      case 'csv':
        content = convertToCSV(results);
        filename = `forge-results-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'markdown':
        content = convertToMarkdown(results);
        filename = `forge-results-${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
    }
    
    downloadFile(content, filename, mimeType);
  };
  
  return (
    <div className="space-y-2">
      <Select value={format} onValueChange={setFormat}>
        <SelectTrigger>
          <SelectValue placeholder="Export format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="markdown">Markdown</SelectItem>
        </SelectContent>
      </Select>
      
      <Button onClick={exportData} className="w-full">
        <Download className="w-3 h-3 mr-1" />
        Export Results
      </Button>
    </div>
  );
};
```

## Troubleshooting

### Common Desktop Issues

#### Layout Problems
```typescript
// Ensure proper layout constraints
const DesktopLayout = () => {
  useEffect(() => {
    // Fix layout on window resize
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        // Force mobile layout
        document.body.classList.add('mobile-layout');
      } else {
        document.body.classList.remove('mobile-layout');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
};
```

#### Performance Issues
```typescript
// Optimize rendering for large lists
const VirtualizedModelList = ({ models }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  const handleScroll = (e: React.UIEvent) => {
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 80; // Approximate height of model card
    const start = Math.floor(scrollTop / itemHeight);
    const end = start + Math.ceil(window.innerHeight / itemHeight) + 5;
    
    setVisibleRange({ start, end });
  };
  
  const visibleModels = models.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div
      className="overflow-y-auto"
      style={{ height: '100%' }}
      onScroll={handleScroll}
    >
      <div style={{ height: models.length * 80, position: 'relative' }}>
        {visibleModels.map((model, index) => (
          <div
            key={model.id}
            style={{
              position: 'absolute',
              top: (visibleRange.start + index) * 80,
              width: '100%',
              height: 80
            }}
          >
            <ModelCard model={model} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Memory Leaks
```typescript
// Proper cleanup of resources
const DesktopLayout = () => {
  useEffect(() => {
    // Set up intervals and event listeners
    const telemetryInterval = setInterval(updateTelemetry, 500);
    const resizeObserver = new ResizeObserver(handleResize);
    
    resizeObserver.observe(document.body);
    
    return () => {
      // Cleanup on unmount
      clearInterval(telemetryInterval);
      resizeObserver.disconnect();
    };
  }, []);
};
```

### Browser Compatibility

#### Chrome/Edge
```typescript
// Chrome-specific optimizations
const chromeOptimizations = () => {
  useEffect(() => {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Optimize for Chrome's rendering
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Perform non-critical updates
        updateNonCriticalUI();
      });
    }
    
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
};
```

#### Firefox
```typescript
// Firefox-specific fixes
const firefoxFixes = () => {
  useEffect(() => {
    const isFirefox = navigator.userAgent.includes('Firefox');
    
    if (isFirefox) {
      // Fix scrollbar issues
      document.documentElement.style.scrollbarWidth = 'thin';
      
      // Fix flexbox rendering
      document.body.style.display = 'flex';
      document.body.style.flexDirection = 'column';
    }
    
    return () => {
      if (isFirefox) {
        document.documentElement.style.scrollbarWidth = '';
        document.body.style.display = '';
        document.body.style.flexDirection = '';
      }
    };
  }, []);
};
```

---

This guide covers all aspects of desktop usage in FORGE. The desktop interface provides comprehensive access to all features with professional-grade tools for extended work sessions.
