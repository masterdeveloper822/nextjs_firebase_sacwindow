# **App Name**: ClientCare Central

## Core Features:

- Secure Authentication: User authentication and role management (attendant, administrator) via Firebase Authentication, ensuring role-based access control to different features and data.
- Manifestation Dashboard: Display a sortable and filterable list of customer complaints with key details, status-based color-coding (resolved, pending, in analysis), and action buttons (view, edit, forward, close).
- New Manifestation Initiation: Streamlined form to initiate new customer complaints with client search, auto-fill, and direct navigation to complaint details.
- Complaint Details View: Comprehensive display of customer data, order history, complaint details, file upload (Firebase Storage), attendant notes, recommended actions, collection types, SLA countdown, and action history.
- Order Items Table: Table displaying individual items of an order, listing product codes, descriptions, quantities, unit values, item totals, and lot numbers.
- Product Return Management: Interface to manage products for return, with auto-completion for order numbers and product codes, automatic product name retrieval, and validation between return quantity and label details.
- AI-Driven Action Suggestions: AI powered LLM tool that assists agents by analyzing complaint descriptions and suggesting the most relevant recommended actions based on historical data.

## Style Guidelines:

- Primary color: Soft blue (#64B5F6) to convey trust and stability. 
- Background color: Light grey (#F0F4F7), a very desaturated version of the primary, for a clean, uncluttered interface.
- Accent color: Muted teal (#4DB6AC), slightly analogous to the primary, for highlighting key actions and elements without being distracting.
- Clean, sans-serif font for optimal readability across all screen sizes.
- Consistent use of minimalist icons to represent complaint status and action types.
- Responsive design with a focus on clear information hierarchy and intuitive navigation.
- Subtle transitions and animations for interactive elements to provide feedback and enhance user experience.