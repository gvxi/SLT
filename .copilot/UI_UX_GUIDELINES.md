# UI/UX Design Guidelines for this Project

## Visual Design Principles

### Design System Foundations
- **Visual Hierarchy**: Clear information architecture with consistent spacing
- **Consistency**: Uniform component behavior across all screens
- **Proximity**: Related elements grouped, unrelated separated
- **Alignment**: 8px grid system with consistent margins and padding

### Typography Scale
```typescript
// theme/theme.ts
const typography = {
  h1: { fontSize: '2.5rem', fontWeight: 600 },
  h2: { fontSize: '2rem', fontWeight: 600 },
  h3: { fontSize: '1.75rem', fontWeight: 600 },
  h4: { fontSize: '1.5rem', fontWeight: 600 },
  h5: { fontSize: '1.25rem', fontWeight: 600 },
  h6: { fontSize: '1rem', fontWeight: 600 },
  subtitle1: { fontSize: '1rem', fontWeight: 400 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
  body1: { fontSize: '1rem', fontWeight: 400 },
  body2: { fontSize: '0.875rem', fontWeight: 400 },
  button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' },
  caption: { fontSize: '0.75rem', fontWeight: 400 }
}
```

### Color Usage Patterns
- **Primary Actions**: Primary color for main CTAs
- **Secondary Actions**: Outlined buttons with primary color
- **Destructive Actions**: Error color for delete/destructive actions
- **Neutral States**: Text and disabled states use MUI text.secondary

## Layout Patterns

### Desktop Layout (≥900px)
```jsx
// Layout structure for desktop
<Box sx={{ display: 'flex', minHeight: '100vh' }}>
  <Sidebar width={240} />
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <TopAppBar />
    <MainContent sx={{ flex: 1, p: 3 }}>
      {/* Page content */}
    </MainContent>
  </Box>
</Box>
```

### Mobile Layout (<900px)
```jsx
// Layout structure for mobile
<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
  <TopAppBar withHamburger />
  <MainContent sx={{ flex: 1, p: 2, pb: 8 }}>
    {/* Page content */}
  </MainContent>
  <BottomNavigation />
</Box>
```

### Responsive Spacing
- **Desktop**: theme.spacing(3) - 24px
- **Tablet**: theme.spacing(2) - 16px  
- **Mobile**: theme.spacing(1.5) - 12px

## Component Design Patterns

### Button Hierarchy
```typescript
// Primary action - most important
<Button variant="contained">Primary Action</Button>

// Secondary action - less important
<Button variant="outlined">Secondary</Button>

// Tertiary action - minimal emphasis
<Button variant="text">Tertiary</Button>

// Destructive action
<Button variant="outlined" color="error">Delete</Button>
```

### Form Design Patterns

#### Input Field Structure
```jsx
<Box sx={{ mb: 2 }}>
  <InputLabel htmlFor="field-name">
    {t('field.label')}
  </InputLabel>
  <TextField
    id="field-name"
    variant="outlined"
    fullWidth
    error={!!errors.fieldName}
    helperText={errors.fieldName?.message}
    {...register('fieldName')}
  />
</Box>
```

#### Form Validation Feedback
- **Success**: Green border + check icon (optional)
- **Error**: Red border + error message
- **Loading**: Disabled state with spinner
- **Required**: Asterisk + clear labeling

### Card Design Patterns

#### Data Card Structure
```jsx
<Card 
  sx={{ 
    p: 2, 
    borderRadius: 2,
    '&:hover': { boxShadow: 2 }
  }}
>
  <CardHeader
    title={title}
    subheader={subtitle}
    action={<IconButton><MoreVertIcon /></IconButton>}
  />
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardActions>
    <Button size="small">Action</Button>
  </CardActions>
</Card>
```

### Table Design Patterns

#### Responsive Data Table
```jsx
<TableContainer component={Paper}>
  <Table sx={{ minWidth: 650 }}>
    <TableHead>
      <TableRow>
        <TableCell>{t('table.header1')}</TableCell>
        <TableCell align="right">{t('table.header2')}</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.id}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

## Interaction Patterns

### Loading States
```jsx
// Skeleton loading
{isLoading ? (
  <Skeleton variant="rectangular" width={200} height={100} />
) : (
  <ActualContent />
)}

// Button loading state
<Button
  variant="contained"
  disabled={isLoading}
  startIcon={isLoading ? <CircularProgress size={16} /> : null}
>
  {isLoading ? t('loading') : t('submit')}
</Button>
```

### Empty States
```jsx
<Box sx={{ 
  textAlign: 'center', 
  py: 8,
  color: 'text.secondary'
}}>
  <InboxIcon sx={{ fontSize: 48, mb: 2 }} />
  <Typography variant="h6" gutterBottom>
    {t('empty.title')}
  </Typography>
  <Typography variant="body2" sx={{ mb: 3 }}>
    {t('empty.description')}
  </Typography>
  <Button variant="contained">
    {t('empty.action')}
  </Button>
</Box>
```

### Error States
```jsx
<Box sx={{ 
  textAlign: 'center', 
  py: 8,
  color: 'error.main'
}}>
  <ErrorIcon sx={{ fontSize: 48, mb: 2 }} />
  <Typography variant="h6" gutterBottom>
    {t('error.title')}
  </Typography>
  <Typography variant="body2" sx={{ mb: 3 }}>
    {error.message}
  </Typography>
  <Button 
    variant="outlined" 
    onClick={onRetry}
    startIcon={<RefreshIcon />}
  >
    {t('error.retry')}
  </Button>
</Box>
```

## Navigation Patterns

### Breadcrumb Navigation
```jsx
<Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
  <Link underline="hover" color="inherit" href="/">
    {t('breadcrumb.home')}
  </Link>
  <Link underline="hover" color="inherit" href="/parent">
    {t('breadcrumb.parent')}
  </Link>
  <Typography color="text.primary">
    {t('breadcrumb.current')}
  </Typography>
</Breadcrumbs>
```

### Tab Navigation
```jsx
<Tabs 
  value={currentTab} 
  onChange={handleTabChange}
  sx={{ borderBottom: 1, borderColor: 'divider' }}
>
  <Tab label={t('tabs.overview')} value="overview" />
  <Tab label={t('tabs.details')} value="details" />
  <Tab label={t('tabs.settings')} value="settings" />
</Tabs>
```

## Accessibility Guidelines

### Keyboard Navigation
- **Tab Order**: Logical focus order following visual layout
- **Skip Links**: Skip to main content for screen readers
- **Focus Indicators**: Visible focus rings for all interactive elements
- **Keyboard Shortcuts**: Common shortcuts (Ctrl+S, Esc, Enter)

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for icons and actions
- **Live Regions**: For dynamic content updates
- **Landmark Roles**: Proper HTML5 semantic elements
- **Form Labels**: Associated labels for all form controls

### Color Contrast
- **Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio
- **Focus States**: High contrast focus indicators

## Animation Guidelines

### Micro-interactions
- **Hover Effects**: Subtle color changes and elevation
- **Focus States**: Clear visual indication of focus
- **Transitions**: 200-300ms duration for smooth animations
- **Easing**: Standard cubic-bezier curves

### Page Transitions
```css
/* Smooth page transitions */
.page-transition-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-transition-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}
```

### Loading Animations
- **Skeleton Screens**: Content placeholder animation
- **Spinners**: Rotating animation for loading states
- **Progress Bars**: Linear progress for longer operations
- **Pulse Effects**: Subtle pulsing for attention

## Internationalization Patterns

### RTL Support Implementation
```jsx
// Use direction-aware styles
<Box sx={{
  marginLeft: theme.direction === 'rtl' ? 0 : theme.spacing(2),
  marginRight: theme.direction === 'rtl' ? theme.spacing(2) : 0
}}>
  {/* Content */}
</Box>

// RTL-aware icons
<IconButton sx={{
  transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none'
}}>
  <ArrowBackIcon />
</IconButton>
```

### Bidirectional Text Handling
```typescript
// Text alignment based on language
const textAlign = i18n.language === 'ar' ? 'right' : 'left';

// Number formatting
const formatNumber = (num: number) => {
  return new Intl.NumberFormat(i18n.language).format(num);
};

// Date formatting  
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(i18n.language).format(date);
};
```

## Performance Optimization Patterns

### Image Optimization
```jsx
<Image
  src="/images/example.jpg"
  alt={t('image.alt')}
  width={400}
  height={300}
  priority={false} // Only for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Lazy Loading Components
```jsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Skeleton variant="rectangular" width={300} height={200} />}>
  <HeavyComponent />
</Suspense>
```

### Memoization Patterns
```jsx
// Expensive calculations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Component memoization
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* render */}</div>;
}, (prev, next) => {
  return prev.data.id === next.data.id;
});
```

## Testing Guidelines

### Component Testing Patterns
```typescript
// Render test
const { getByText } = render(<MyComponent />);
const element = getByText('Expected text');

// Interaction test
fireEvent.click(getByRole('button'));
await waitFor(() => {
  expect(getByText('Updated text')).toBeInTheDocument();
});

// Accessibility test
const { container } = render(<MyComponent />);
expect(await axe(container)).toHaveNoViolations();
```

### Visual Regression Testing
- **Screenshot Testing**: For component visual consistency
- **Cross-browser Testing**: Ensure consistent rendering
- **Mobile Testing**: Responsive design verification
- **Theme Testing**: Light/dark mode consistency