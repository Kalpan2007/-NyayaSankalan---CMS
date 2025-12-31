# ESC Key Implementation Guide

## ✅ What Was Implemented

Added **ESC key functionality** to close modals and popups across the entire application.

## 📁 Files Created

### 1. **Custom Hook**: `src/hooks/useEscapeKey.ts`
Reusable React hook that listens for ESC key press and executes a callback function.

```typescript
import { useEscapeKey } from '../../hooks/useEscapeKey';

// Usage in component
useEscapeKey(onClose); // Always enabled
useEscapeKey(onClose, isModalOpen); // Only enabled when modal is open
```

### 2. **Reusable Modal Component**: `src/components/ui/Modal.tsx`
A fully-featured modal component with built-in ESC key support.

```typescript
import { Modal } from '../../components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  subtitle="Optional subtitle"
  size="lg" // sm, md, lg, xl, 2xl, 3xl, full
  closeOnEscape={true} // Default: true
  closeOnBackdropClick={true} // Default: true
>
  {/* Modal content */}
</Modal>
```

## 🎯 Features

### ESC Key Hook Features:
- ✅ Listens for both `Escape` and `Esc` key events
- ✅ Prevents default browser behavior
- ✅ Stops event propagation
- ✅ Can be conditionally enabled/disabled
- ✅ Automatic cleanup on unmount

### Modal Component Features:
- ✅ **ESC key to close** (configurable)
- ✅ **Click backdrop to close** (configurable)
- ✅ **Customizable sizes** (7 size options)
- ✅ **Smooth animations** (fade-in effect)
- ✅ **Accessibility** (ARIA labels, focus management)
- ✅ **Flexible layout** (header, body, footer sections)
- ✅ **Visual hint** (tooltip shows "Press ESC")

## 📝 Updated Components

### 1. `src/components/ai/GenerateDraftModal.tsx`
- Added `useEscapeKey` hook
- Added ESC hint to close button tooltip
- ESC key now closes the modal

### 2. `src/pages/judge/CaseDetails.tsx`
- Added `useEscapeKey` hook for hearing order draft modal
- Conditional activation (only when modal is open)
- Added ESC hint to close button

### 3. `src/pages/court/CaseDetails.tsx`
- Added `useEscapeKey` hook for hearing order draft modal
- Conditional activation (only when modal is open)
- Added ESC hint to close button

## 🚀 How to Use in New Components

### Method 1: Use the Custom Hook (Simple)

```typescript
import { useState } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // ESC key will close the modal
  useEscapeKey(() => setIsOpen(false), isOpen);
  
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50">
          {/* Your modal content */}
        </div>
      )}
    </>
  );
};
```

### Method 2: Use the Modal Component (Recommended)

```typescript
import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Modal"
        subtitle="This is a subtitle"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        }
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
};
```

## 🎨 Modal Customization Options

### Size Options:
- `sm` - 384px (max-w-sm)
- `md` - 448px (max-w-md) - **Default**
- `lg` - 512px (max-w-lg)
- `xl` - 576px (max-w-xl)
- `2xl` - 672px (max-w-2xl)
- `3xl` - 768px (max-w-3xl)
- `full` - Full width with margins

### Props:
```typescript
interface ModalProps {
  isOpen: boolean;                    // Required
  onClose: () => void;                // Required
  title?: string;                     // Optional
  subtitle?: string;                  // Optional
  children: ReactNode;                // Required
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showCloseButton?: boolean;          // Default: true
  closeOnBackdropClick?: boolean;     // Default: true
  closeOnEscape?: boolean;            // Default: true
  footer?: ReactNode;                 // Optional
  headerClassName?: string;           // Optional
  bodyClassName?: string;             // Optional
  footerClassName?: string;           // Optional
}
```

## 💡 Best Practices

### 1. **Always Provide Visual Hints**
```typescript
<button 
  onClick={onClose}
  title="Close (Press ESC)"  // ✅ Good: Users know they can press ESC
  aria-label="Close modal"
>
  ✕
</button>
```

### 2. **Conditionally Enable ESC Key**
```typescript
// ✅ Good: Only active when modal is open
useEscapeKey(onClose, isModalOpen);

// ❌ Bad: Always active, might interfere with other components
useEscapeKey(onClose);
```

### 3. **Prevent Event Bubbling**
The hook automatically prevents default behavior and stops propagation, so nested modals won't interfere with each other.

### 4. **Accessibility**
Always include:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` (if you have a title)
- `aria-label` on close button

## 🔧 Troubleshooting

### ESC key not working?
1. Check if the hook is being called
2. Verify the `enabled` parameter is `true`
3. Check browser console for errors
4. Ensure no other component is capturing the ESC key

### Multiple modals interfering?
Use conditional enabling:
```typescript
useEscapeKey(closeModal1, isModal1Open);
useEscapeKey(closeModal2, isModal2Open);
```

### Want to disable ESC key?
```typescript
// Method 1: Don't call the hook
// Method 2: Pass false as second parameter
useEscapeKey(onClose, false);

// Method 3: In Modal component
<Modal closeOnEscape={false} ... />
```

## 📊 Browser Compatibility

✅ **Fully Supported:**
- Chrome/Edge (all versions)
- Firefox (all versions)
- Safari (all versions)
- Opera (all versions)

The hook uses standard `keydown` event which is supported in all modern browsers.

## 🎯 Future Enhancements

Potential improvements for the future:

1. **Multiple Key Support**
   ```typescript
   useKeyPress(['Escape', 'q'], onClose); // Close on ESC or Q
   ```

2. **Key Combinations**
   ```typescript
   useKeyCombo(['Ctrl', 'k'], onSearch); // Ctrl+K to search
   ```

3. **Focus Trap**
   - Trap focus within modal when open
   - Return focus to trigger element on close

4. **Animation Callbacks**
   - onOpen callback
   - onClose callback
   - Animation complete callbacks

## 📚 Related Files

- `/src/hooks/useEscapeKey.ts` - Custom hook
- `/src/components/ui/Modal.tsx` - Reusable modal component
- `/src/components/ai/GenerateDraftModal.tsx` - Example usage
- `/src/pages/judge/CaseDetails.tsx` - Example usage
- `/src/pages/court/CaseDetails.tsx` - Example usage

---

**Built with ❤️ for NyayaSankalan - Enhanced UX with ESC key support**
