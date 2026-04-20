# Project-Specific UI/UX Patterns

## Business Application Conventions

### Corporate Design Language
- **Professional Aesthetic**: Clean, corporate appearance suitable for business use
- **Data Density**: Optimized for information-rich interfaces (tables, dashboards)
- **Formal Tone**: Professional language and presentation
- **Brand Consistency**: MUI components with custom branding

### Industry Standards Compliance
- **Financial Data**: Proper number formatting and currency display
- **Date/Time**: ISO standards with proper timezone handling
- **Data Validation**: Strict validation for financial calculations
- **Audit Trails**: Clear data modification tracking

## Module-Specific Patterns

### Dashboard (`/dashboard`)
```jsx
// KPI Card Pattern
<Card sx={{ p: 2, textAlign: 'center' }}>
  <Typography variant="h4" color="primary" gutterBottom>
    {formatNumber(metricValue)}
  </Typography>
  <Typography variant="body2" color="text.secondary">
    {t('dashboard.metricName')}
  </Typography>
  <TrendIndicator value={trend} />
</Card>

// Chart Container Pattern
<Paper sx={{ p: 3, height: 300 }}>
  <Typography variant="h6" gutterBottom>
    {t('chart.title')}
  </Typography>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={chartData}>
      {/* Chart configuration */}
    </LineChart>
  </ResponsiveContainer>
</Paper>
```

### Task Management (`/tasks`)
```jsx
// Kanban Column Pattern
<Paper 
  sx={{ 
    minWidth: 300, 
    p: 2,
    backgroundColor: 'grey.50'
  }}
>
  <Typography variant="h6" sx={{ mb: 2 }}>
    {t(`tasks.status.${status}`)}
    <Chip 
      label={tasks.length} 
      size="small" 
      sx={{ ml: 1 }}
    />
  </Typography>
  <Droppable droppableId={status}>
    {(provided) => (
      <Box 
        ref={provided.innerRef}
        {...provided.droppableProps}
        sx={{ minHeight: 100 }}
      >
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
        {provided.placeholder}
      </Box>
    )}
  </Droppable>
</Paper>

// Task Card Pattern
<Paper 
  sx={{ 
    p: 2, 
    mb: 1,
    cursor: 'grab',
    '&:active': { cursor: 'grabbing' }
  }}
  {...dragHandleProps}
>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
    <Typography variant="subtitle2" sx={{ flex: 1 }}>
      {task.title}
    </Typography>
    <PriorityBadge priority={task.priority} />
  </Box>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <AvatarGroup max={3} sx={{ fontSize: 12 }}>
      {task.assignees.map(assignee => (
        <Avatar 
          key={assignee.id} 
          src={assignee.avatar} 
          sx={{ width: 24, height: 24 }}
        />
      ))}
    </AvatarGroup>
    <Typography variant="caption" color="text.secondary">
      {formatDate(task.dueDate)}
    </Typography>
  </Box>
</Paper>
```

### Product Catalog (`/products`)
```jsx
// Product Table Pattern
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>{t('products.sku')}</TableCell>
        <TableCell>{t('products.name')}</TableCell>
        <TableCell align="right">{t('products.price')}</TableCell>
        <TableCell align="right">{t('products.stock')}</TableCell>
        <TableCell>{t('products.status')}</TableCell>
        <TableCell>{t('products.actions')}</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {products.map((product) => (
        <TableRow key={product.id}>
          <TableCell>{product.sku}</TableCell>
          <TableCell>
            <Box>
              <Typography variant="body2">
                {i18n.language === 'ar' ? product.name_ar : product.name_en}
              </Typography>
              {product.name_ar && product.name_en && (
                <Typography variant="caption" color="text.secondary">
                  {i18n.language === 'ar' ? product.name_en : product.name_ar}
                </Typography>
              )}
            </Box>
          </TableCell>
          <TableCell align="right">
            {formatCurrency(product.unit_price)}
          </TableCell>
          <TableCell align="right">
            <StockIndicator quantity={product.stock_qty} />
          </TableCell>
          <TableCell>
            <StatusChip status={product.status} />
          </TableCell>
          <TableCell>
            <IconButton size="small"><EditIcon /></IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Invoice/Quotation Management
```jsx
// Document Header Pattern
<Paper sx={{ p: 3, mb: 3 }}>
  <Grid container spacing={3}>
    <Grid item xs={6}>
      <Typography variant="h6" gutterBottom>
        {t('invoice.from')}
      </Typography>
      <CompanyInfo />
    </Grid>
    <Grid item xs={6}>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="h4" gutterBottom>
          {t(`document.${documentType}`)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          #{document.document_number}
        </Typography>
      </Box>
    </Grid>
    <Grid item xs={6}>
      <Typography variant="h6" gutterBottom>
        {t('invoice.to')}
      </Typography>
      <ClientInfo client={document.client} />
    </Grid>
    <Grid item xs={6}>
      <Box sx={{ textAlign: 'right' }}>
        <DocumentDates 
          issueDate={document.issue_date}
          dueDate={document.due_date}
        />
      </Box>
    </Grid>
  </Grid>
</Paper>

// Line Items Table Pattern
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>{t('invoice.item')}</TableCell>
        <TableCell align="right">{t('invoice.quantity')}</TableCell>
        <TableCell align="right">{t('invoice.unitPrice')}</TableCell>
        <TableCell align="right">{t('invoice.total')}</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {document.items.map((item, index) => (
        <TableRow key={index}>
          <TableCell>
            <Typography variant="body2">
              {item.description}
            </Typography>
            {item.product_sku && (
              <Typography variant="caption" color="text.secondary">
                SKU: {item.product_sku}
              </Typography>
            )}
          </TableCell>
          <TableCell align="right">{item.quantity}</TableCell>
          <TableCell align="right">
            {formatCurrency(item.unit_price)}
          </TableCell>
          <TableCell align="right">
            {formatCurrency(item.quantity * item.unit_price)}
          </TableCell>
        </TableRow>
      ))}
      <TableRow>
        <TableCell colSpan={3} align="right">
          <Typography variant="body2">
            {t('invoice.subtotal')}
          </Typography>
        </TableCell>
        <TableCell align="right">
          {formatCurrency(subtotal)}
        </TableCell>
      </TableRow>
      {document.tax_pct > 0 && (
        <TableRow>
          <TableCell colSpan={3} align="right">
            <Typography variant="body2">
              {t('invoice.tax', { percent: document.tax_pct })}
            </Typography>
          </TableCell>
          <TableCell align="right">
            {formatCurrency(taxAmount)}
          </TableCell>
        </TableRow>
      )}
      <TableRow>
        <TableCell colSpan={3} align="right">
          <Typography variant="h6">
            {t('invoice.total')}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="h6">
            {formatCurrency(total)}
          </Typography>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

## Bilingual Implementation Patterns

### RTL/LTR Text Handling
```typescript
// Text direction utility
const getTextDirection = (text: string): 'rtl' | 'ltr' => {
  // Simple heuristic for Arabic text detection
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? 'rtl' : 'ltr';
};

// Mixed content component
<Box sx={{ direction: getTextDirection(content) }}>
  {content}
</Box>
```

### Language-Specific Formatting
```typescript
// Currency formatting
const formatCurrency = (amount: number, currency: string = 'SAR') => {
  const formatter = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

// Date formatting with Arabic support
const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}) => {
  const isArabic = i18n.language === 'ar';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat(i18n.language, defaultOptions).format(date);
};
```

## Data Display Components

### Status Indicators
```jsx
// Status Chip Component
const StatusChip = ({ status }: { status: string }) => {
  const statusConfig = {
    active: { color: 'success', label: t('status.active') },
    inactive: { color: 'default', label: t('status.inactive') },
    draft: { color: 'default', label: t('status.draft') },
    sent: { color: 'info', label: t('status.sent') },
    paid: { color: 'success', label: t('status.paid') },
    overdue: { color: 'error', label: t('status.overdue') },
    cancelled: { color: 'error', label: t('status.cancelled') }
  };
  
  const config = statusConfig[status] || { color: 'default', label: status };
  
  return (
    <Chip 
      label={config.label}
      color={config.color as any}
      size="small"
      variant="outlined"
    />
  );
};
```

### Priority Badges
```jsx
// Priority Indicator
const PriorityBadge = ({ priority }: { priority: string }) => {
  const priorityConfig = {
    high: { color: 'error', icon: <PriorityHighIcon /> },
    medium: { color: 'warning', icon: <PriorityMediumIcon /> },
    low: { color: 'success', icon: <PriorityLowIcon /> }
  };
  
  const config = priorityConfig[priority] || { color: 'default', icon: null };
  
  return (
    <Chip
      icon={config.icon}
      color={config.color as any}
      size="small"
      variant="outlined"
      label={t(`priority.${priority}`)}
    />
  );
};
```

### Stock Level Indicators
```jsx
// Stock Quantity Indicator
const StockIndicator = ({ quantity }: { quantity: number }) => {
  let color: ThemeColor = 'success';
  let variant: 'text' | 'outlined' = 'text';
  
  if (quantity === 0) {
    color = 'error';
    variant = 'outlined';
  } else if (quantity < 10) {
    color = 'warning';
    variant = 'outlined';
  }
  
  return (
    <Chip
      label={quantity}
      color={color}
      variant={variant}
      size="small"
    />
  );
};
```

## Form Patterns for Business Data

### Product Selection
```jsx
// Product Select with Search
<Autocomplete
  options={products}
  getOptionLabel={(option) => 
    i18n.language === 'ar' ? option.name_ar : option.name_en
  }
  renderOption={(props, option) => (
    <li {...props}>
      <Box>
        <Typography variant="body2">
          {i18n.language === 'ar' ? option.name_ar : option.name_en}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          SKU: {option.sku} • {formatCurrency(option.unit_price)}
        </Typography>
      </Box>
    </li>
  )}
  renderInput={(params) => (
    <TextField
      {...params}
      label={t('form.selectProduct')}
      variant="outlined"
    />
  )}
  onChange={(event, value) => setSelectedProduct(value)}
/>
```

### Client Selection
```jsx
// Client Select with Creation
<Autocomplete
  options={clients}
  getOptionLabel={(option) => 
    i18n.language === 'ar' ? option.name_ar : option.name_en
  }
  renderOption={(props, option) => (
    <li {...props}>
      <Box>
        <Typography variant="body2">
          {i18n.language === 'ar' ? option.name_ar : option.name_en}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {option.email} • {option.phone}
        </Typography>
      </Box>
    </li>
  )}
  renderInput={(params) => (
    <TextField
      {...params}
      label={t('form.selectClient')}
      variant="outlined"
    />
  )}
  freeSolo
  onCreateOption={handleCreateClient}
  onChange={(event, value) => setSelectedClient(value)}
/>
```

## PDF Export Patterns

### Invoice PDF Template
```jsx
// PDF Document Structure
<Document>
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>
        {t('invoice.title')}
      </Text>
      <Text style={styles.invoiceNumber}>
        #{invoice.invoice_number}
      </Text>
    </View>
    
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t('invoice.from')}
      </Text>
      <Text>{companyInfo.name}</Text>
      <Text>{companyInfo.address}</Text>
      <Text>{companyInfo.phone}</Text>
    </View>
    
    {/* Continue with client info, line items, totals */}
  </Page>
</Document>
```

### PDF Styles
```typescript
// PDF Style Definitions
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #666',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#666'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  }
});
```