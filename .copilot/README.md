# GitHub Copilot Configuration

This directory contains frontend and UI/UX skills documentation for GitHub Copilot to enhance code generation for this project.

## Files Overview

### `FRONTEND_SKILLS.md`
Comprehensive guide covering:
- MUI v6 implementation patterns
- Component architecture best practices
- Performance optimizations
- Internationalization (i18n) patterns
- Accessibility guidelines
- Testing strategies

### `UI_UX_GUIDELINES.md`
Detailed design system documentation:
- Visual design principles
- Layout patterns (desktop/mobile)
- Component design patterns
- Interaction patterns (loading, empty, error states)
- Animation guidelines
- Accessibility standards

### `PROJECT_SPECIFICS.md`
Project-specific implementation patterns:
- Business application conventions
- Module-specific component patterns (Dashboard, Tasks, Products, Invoices)
- Bilingual implementation (Arabic/English)
- Data display components
- Form patterns for business data
- PDF export patterns

## How Copilot Uses These Files

GitHub Copilot will reference these files to:
1. **Understand project conventions** and maintain consistency
2. **Generate appropriate component structures** following MUI v6 patterns
3. **Implement bilingual support** with proper RTL/LTR handling
4. **Follow accessibility guidelines** and WCAG compliance
5. **Apply performance optimizations** specific to this project
6. **Use proper TypeScript patterns** with strict typing

## Key Project Constraints for Copilot

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **UI Library**: MUI v6 (Material-UI)
- **Styling**: MUI `sx` prop (no Tailwind CSS)
- **Language**: TypeScript with strict mode
- **State Management**: Zustand + React Query
- **i18n**: next-i18next with Arabic/English support

### Design Constraints
- **No hardcoded text** - always use `t('key')` from translations
- **RTL support** for Arabic language (direction switching)
- **Professional corporate aesthetic**
- **Responsive design** with mobile-first approach
- **Accessibility compliance** (WCAG 2.1 AA)

### Code Quality
- **Strict TypeScript** - no `any` types
- **ESLint compliance** - follow project linting rules
- **Component composition** - reusable, composable components
- **Performance optimization** - memoization, lazy loading
- **Testing coverage** - unit and integration tests

## Common Patterns

### Component Structure
```tsx
// Correct pattern for this project
const MyComponent = ({ data }: { data: DataType }) => {
  const { t } = useTranslation();
  
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('component.title')}
      </Typography>
      <Box>{/* Content */}</Box>
    </Paper>
  );
};
```

### Form Handling
```tsx
// React Hook Form + Zod pattern
const validationSchema = z.object({
  name: z.string().min(1, t('validation.required')),
  email: z.string().email(t('validation.email'))
});

const form = useForm({
  resolver: zodResolver(validationSchema)
});
```

### Data Fetching
```tsx
// React Query pattern
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
});
```

## Getting Started with New Features

When implementing new features, Copilot should:
1. **Check existing patterns** in the relevant module
2. **Follow component structure** from similar components
3. **Use proper TypeScript types** from `/types`
4. **Implement bilingual support** with translation keys
5. **Add appropriate tests** following testing patterns
6. **Consider mobile responsiveness** and RTL support

## Best Practices for Copilot

### Do's
- ✅ Use MUI components with `sx` prop for styling
- ✅ Implement proper TypeScript interfaces
- ✅ Use translation keys instead of hardcoded text
- ✅ Follow responsive design patterns
- ✅ Add accessibility attributes (aria-labels, etc.)
- ✅ Use React Query for server state management
- ✅ Implement proper error boundaries and loading states

### Don'ts
- ❌ Don't use inline styles or Tailwind CSS
- ❌ Don't hardcode text strings
- ❌ Don't use `any` TypeScript types
- ❌ Don't ignore RTL/LTR requirements
- ❌ Don't skip accessibility considerations
- ❌ Don't create components without proper TypeScript typing
- ❌ Don't implement custom state management when Zustand/React Query suffice

## Testing Guidelines

Copilot should generate tests that:
- Use React Testing Library for component tests
- Mock API calls appropriately
- Test both happy paths and error cases
- Include accessibility testing
- Verify bilingual functionality
- Test responsive behavior

## Performance Considerations

When generating code, consider:
- Memoization for expensive calculations
- Lazy loading for heavy components
- Proper React Query caching strategies
- Image optimization with Next.js Image component
- Bundle size optimization through code splitting

This documentation ensures GitHub Copilot generates code that aligns with the project's architecture, design system, and quality standards.