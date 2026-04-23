# Frontend & UI/UX Skills for this Project

## Design System & Styling

### MUI v6 Implementation Patterns
- **Component Structure**: Use MUI `sx` prop for styling, no Tailwind CSS
- **Theme System**: Centralized theme configuration in `theme/theme.ts`
- **Typography**: Inter (LTR), Cairo (RTL/Arabic) with proper fallbacks
- **Spacing**: 8px grid system, use theme spacing: `theme.spacing(2)`
- **Corner Radius**: Consistent 8px border radius globally

### Layout Patterns
- **Desktop**: Sidebar + Top AppBar (240px sidebar, responsive)
- **Mobile**: Bottom Navigation with collapsible Drawer
- **Responsive Breakpoint**: 900px threshold
- **Container Width**: Fluid containers with max-width constraints

### Color Palette
- **Primary**: Deep Indigo `#3F51B5` (MUI default)
- **Surface**: Light mode primary, optional dark mode support
- **Status Colors**: Follow MUI success/error/warning/info conventions
- **Accessibility**: WCAG AA compliance for contrast ratios

## Component Architecture

### Reusable Components
- **Form Components**: React Hook Form + Zod validation
- **Data Display**: Tables, Cards, Lists with consistent patterns
- **Navigation**: Sidebar, TopAppBar, BottomNav components
- **Dialogs**: ConfirmDialog with standardized API

### State Management
- **Client State**: Zustand stores in `/store` directory
- **Server State**: React Query with custom hooks in `/hooks`
- **Form State**: React Hook Form with local state management

## Performance Optimizations

### Bundle Optimization
- **Code Splitting**: Dynamic imports for large components
- **Tree Shaking**: ES modules with MARI optimization
- **Image Optimization**: Next.js Image component with platform CDN support

### Rendering Performance
- **Memoization**: React.memo for expensive components
- **Virtualization**: For large lists and tables
- **Lazy Loading**: Components and data fetching

## Internationalization (i18n)

### RTL/LTR Support
- **Language Detection**: User preference + localStorage
- **Layout Direction**: `dir="rtl"` on html element for Arabic
- **Font Switching**: Inter → Cairo based on language
- **Translation Files**: JSON structure in `public/locales`

### Translation Integration
- **Component Pattern**: Always use `t('key')` from `next-i18next`
- **String Extraction**: No hardcoded text in components
- **Fallback Strategy**: English as fallback language

## UI/UX Patterns

### Interaction Patterns
- **Loading States**: Skeleton screens for async operations
- **Error Handling**: Toast notifications with error boundaries
- **Success Feedback**: Snackbar notifications for actions
- **Progressive Disclosure**: Complex forms in steps/modal flows

### Accessibility (a11y)
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus trapping and ordering
- **Color Contrast**: WCAG 2.1 AA compliance

### Animation & Transitions
- **Micro-interactions**: Subtle hover and focus states
- **Page Transitions**: Smooth route transitions
- **Loading Animations**: Contextual loading indicators

## Data Visualization

### Chart Components
- **Recharts Integration**: Standardized chart components
- **Responsive Charts**: Auto-resize with container
- **Theme Integration**: MUI colors and typography

### Dashboard Patterns
- **KPI Cards**: Standardized metric display
- **Data Grids**: Responsive table components
- **Filter Systems**: Consistent filter UI patterns

## Form Design Patterns

### Form Architecture
- **Validation**: Zod schemas co-located with forms
- **Error Display**: Inline validation messages
- **Submission**: Optimistic updates with error handling

### Complex Form Patterns
- **Dynamic Fields**: Add/remove form fields
- **Wizard Forms**: Multi-step form flows
- **Inline Editing**: Table row editing patterns

## Component Library Best Practices

### Naming Conventions
- **Component Files**: PascalCase for component names
- **Hook Files**: `use` prefix with camelCase
- **Utility Files**: camelCase for helper functions

### Prop Patterns
- **Component Props**: TypeScript interfaces with defaults
- **Event Handlers**: `on` prefix with consistent signatures
- **Styling Props**: MUI `sx` prop for custom styles

### Composition Patterns
- **Slot Pattern**: For flexible component composition
- **Compound Components**: Related components grouped together
- **HOC Patterns**: For cross-cutting concerns

## Testing Strategy

### Component Testing
- **Unit Tests**: React Testing Library for components
- **Integration Tests**: User flow testing
- **Visual Tests**: Screenshot testing for UI regressions

### E2E Testing
- **Playwright/Cypress**: For critical user journeys
- **Accessibility Tests**: Automated a11y testing
- **Performance Tests**: Lighthouse CI integration

## Development Workflow

### Code Quality
- **TypeScript**: Strict mode enabled, no `any` types
- **Linting**: ESLint with project-specific rules
- **Formatting**: Prettier with consistent configuration

### Git Practices
- **Commit Messages**: Conventional commits
- **Branch Strategy**: Feature branches with PR reviews
- **Code Review**: Component and pattern consistency checks