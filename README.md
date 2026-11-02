# TabBoard — Frontend

**An AI-native productivity workspace built for the Chrome new tab experience.**

TabBoard transforms the Chrome new tab page into a personalized productivity workspace, bringing task scheduling, goal management, daily planning, and information discovery into one cohesive interface.

Built with React and TypeScript using the Plasmo framework, the frontend focuses on modular architecture, intuitive interactions, and a seamless browser experience.

## Product Vision

Traditional productivity applications often separate task management, goal tracking, planning, and information discovery across multiple tools.

TabBoard brings these experiences together within the browser, making it easier to organize priorities, manage everyday workflows, and maintain focus.

The long-term vision is to evolve TabBoard into an AI-native workspace that understands individual preferences, interests, and goals to provide personalized planning and intelligent productivity recommendations.

## Core Features

### Productivity Dashboard
- Personalized Chrome new tab dashboard.
- Daily productivity overview and task progress.
- Quick access to frequently used applications and resources.
- Centralized workspace for everyday activities.

### Task Management & Planning
- Daily and weekly task management.
- Scheduled tasks with defined start and end times.
- Task prioritization and status tracking.
- Timeline-based planning experience.

### Goal Management
- Organize goals across different areas of life.
- Track progress and completion.
- Associate tasks with long-term goals.
- Categorize goals to support structured personal planning.

### Onboarding & Personalization
- Multi-step onboarding experience.
- User profile and preference management.
- Interest and personality-based personalization.
- Structured user context for future AI-powered features.

### Information & Discovery
- Technology and AI news.
- Developer-focused resources.
- Learning and discovery shortcuts.

### AI-Native Experience

TabBoard is being designed with AI as an integral part of the product experience rather than an isolated chatbot.

Planned capabilities include:
- Personalized daily planning using onboarding information.
- Intelligent task prioritization and recommendations.
- Context-aware productivity assistance.

*Gemini-powered personalization is part of the ongoing development roadmap.*

## Frontend Architecture

The application follows a modular React architecture, separating page-level features, reusable UI components, application state, and API communication.

### Technology Stack

| Category | Technologies |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Extension Framework | Plasmo 0.90.5 |
| Platform | Chrome Extension Manifest V3 |
| Routing | React Router |
| State Management | Redux |
| Icons | Lucide React |
| Authentication | Chrome Identity API |
| API Integration | REST APIs |

## Engineering Highlights

- **Modular component architecture:** Feature-oriented page organization and reusable UI components.
- **Application state management:** Centralized state for managing shared application data.
- **API-driven frontend:** Integration with authenticated backend endpoints for tasks, goals, profiles, and onboarding.
- **Browser integration:** Chrome extension APIs, extension permissions, and Google OAuth authentication.
- **Extension-specific navigation:** Hash-based routing to support navigation within the Chrome extension environment.
- **User experience:** Interface design focused on clarity, usability, and efficient workflows.

## Backend Integration

The frontend communicates with a separately maintained Django REST API.

The backend handles authentication, user profiles, onboarding, task management, and goal management.

API configuration is managed through Plasmo environment variables:

`PLASMO_PUBLIC_API_BASE_URL`

Google authentication uses the Chrome Identity API and a public OAuth client ID configured through:

`PLASMO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`

The configured API origin must also be included in the extension's `host_permissions`.

No OAuth client secret is embedded in the extension.

## Getting Started

### Prerequisites
- Node.js
- pnpm
- Google OAuth Chrome extension client configuration
- Running TabBoard backend API

### Installation

```bash
git clone <FRONTEND_REPOSITORY_URL>
cd tabboard
pnpm install
```

### Environment Configuration

Configure the appropriate Plasmo environment file:

```env
PLASMO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
PLASMO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
```

Ensure the configured API origin is included in the extension's `host_permissions`.

### Development

```bash
pnpm dev
```

Load the generated development extension through Chrome's Extensions page with Developer Mode enabled.

The backend must be running and accessible for authentication and onboarding functionality.

### Production Build

```bash
pnpm build
```

## Related Repository

- **Backend:** [TabBoard API](<BACKEND_REPOSITORY_URL>)

## Development Status

**In Development**

The frontend architecture, authentication integration, onboarding experience, and core productivity workflows are under active development.

The next phase focuses on expanding the planning experience and introducing Gemini-powered personalization using the structured user context established during onboarding.
