# Requirements Document

## Introduction

This document outlines the requirements for a full-stack college canteen food ordering platform that enables students to browse menus, place orders, and track their status in real-time. The system also provides staff with tools to manage orders, menus, and offline payments. The platform uses React.js for the frontend, Node.js/Express for the backend, MongoDB for data storage, and WebSocket for real-time communication.

## Requirements

### Requirement 1

**User Story:** As a student, I want to create an account and log in securely, so that I can access the ordering system and track my orders.

#### Acceptance Criteria

1. WHEN a user visits the signup page THEN the system SHALL require email, password, name, and WhatsApp number
2. WHEN a user submits valid signup information THEN the system SHALL create an account with hashed password storage
3. WHEN a user logs in with valid credentials THEN the system SHALL generate a JWT token and route them based on their role
4. WHEN a user provides invalid login credentials THEN the system SHALL display an appropriate error message
5. WHEN a JWT token expires THEN the system SHALL redirect the user to the login page

### Requirement 2

**User Story:** As a student, I want to browse available menu items and place orders, so that I can purchase food from the canteen.

#### Acceptance Criteria

1. WHEN a student accesses the menu page THEN the system SHALL display all available menu items with names, descriptions, and prices
2. WHEN a student selects items and quantities THEN the system SHALL allow them to add items to their order
3. WHEN a student places an order THEN the system SHALL require selection of payment type (online or offline)
4. WHEN an order is successfully placed THEN the system SHALL generate a unique order number and redirect to order tracking page
5. WHEN a menu item is unavailable THEN the system SHALL prevent it from being ordered

### Requirement 3

**User Story:** As a student, I want to track my order status in real-time, so that I know when my food is ready for pickup.

#### Acceptance Criteria

1. WHEN a student visits /order/:orderId THEN the system SHALL display current order status
2. WHEN order status changes THEN the system SHALL update the display in real-time using WebSocket
3. WHEN an order progresses through statuses THEN the system SHALL show: Payment Pending → To Be Prepared → Ready for Pickup → Picked Up
4. WHEN a student shares an order link THEN other users SHALL be able to view the order status

### Requirement 4

**User Story:** As a student, I want to view my account information and order history, so that I can manage my profile and track past orders.

#### Acceptance Criteria

1. WHEN a student accesses the account page THEN the system SHALL display their profile information (name, email, WhatsApp)
2. WHEN a student views their account THEN the system SHALL show their last 2 orders
3. WHEN a student clicks "View More Order History" THEN the system SHALL navigate to /orders page
4. WHEN a student views order history THEN the system SHALL display all past orders with status and details

### Requirement 5

**User Story:** As canteen staff, I want to manually place orders for customers, so that I can serve customers who prefer in-person ordering.

#### Acceptance Criteria

1. WHEN staff accesses the manual order page THEN the system SHALL provide input fields for customer name and WhatsApp number
2. WHEN staff selects menu items THEN the system SHALL allow quantity selection and payment method choice
3. WHEN staff submits a manual order THEN the system SHALL create the order and generate an order number
4. WHEN a manual order is placed THEN the system SHALL add it to the order queue

### Requirement 6

**User Story:** As canteen staff, I want to manage menu items, so that I can keep the menu current and set special deals.

#### Acceptance Criteria

1. WHEN staff accesses the menu management page THEN the system SHALL display all menu items with edit/delete options
2. WHEN staff adds a new menu item THEN the system SHALL require name, description, price, and availability status
3. WHEN staff pauses/unpauses an item THEN the system SHALL update its availability immediately
4. WHEN staff sets a "Deal of the Day" THEN the system SHALL apply the discount and auto-reset daily
5. WHEN staff deletes a menu item THEN the system SHALL remove it from the menu but preserve order history

### Requirement 7

**User Story:** As canteen staff, I want to manage the order queue, so that I can efficiently prepare and fulfill orders.

#### Acceptance Criteria

1. WHEN staff accesses the order queue THEN the system SHALL display current orders with order number, items, payment type, and status
2. WHEN staff marks an order as prepared THEN the system SHALL update status to "Ready for Pickup"
3. WHEN order status changes THEN the system SHALL broadcast updates via WebSocket to all connected clients
4. WHEN staff marks an order as ready THEN the system SHALL notify the customer in real-time

### Requirement 8

**User Story:** As canteen staff, I want to confirm offline payments, so that I can process cash transactions and move orders to preparation.

#### Acceptance Criteria

1. WHEN staff accesses offline payment confirmation THEN the system SHALL display orders with "Offline Payment - Cash" status
2. WHEN staff confirms cash collection THEN the system SHALL update payment status to "confirmed"
3. WHEN payment is confirmed THEN the system SHALL move the order to the normal preparation queue
4. WHEN payment confirmation occurs THEN the system SHALL update order status in real-time

### Requirement 9

**User Story:** As a system administrator, I want secure data storage and real-time communication, so that the platform operates reliably and securely.

#### Acceptance Criteria

1. WHEN user data is stored THEN the system SHALL hash passwords using secure algorithms
2. WHEN database operations occur THEN the system SHALL use MongoDB with proper schema validation
3. WHEN real-time updates are needed THEN the system SHALL use Socket.io for WebSocket communication
4. WHEN API requests are made THEN the system SHALL validate JWT tokens for protected routes
5. WHEN the system handles errors THEN it SHALL provide appropriate error messages without exposing sensitive information

### Requirement 10

**User Story:** As a user, I want the platform to work well on mobile devices, so that I can use it conveniently on my phone.

#### Acceptance Criteria

1. WHEN users access the platform on mobile devices THEN the system SHALL display a responsive, mobile-friendly interface
2. WHEN users interact with forms on mobile THEN the system SHALL provide appropriate input types and validation
3. WHEN users navigate the platform on mobile THEN the system SHALL maintain usability across different screen sizes
4. WHEN real-time updates occur on mobile THEN the system SHALL maintain WebSocket connections reliably