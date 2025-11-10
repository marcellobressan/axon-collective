# Axon Collective

A visually stunning, real-time collaborative tool for futures wheel brainstorming and strategic foresight.

[cloudflarebutton]

## About The Project

Axon Collective is a real-time collaborative web application for futures wheel thinking. It allows teams to brainstorm and map the direct and indirect consequences of a particular idea, event, or trend.

Users start with a central concept and collaboratively build out a radial mind map of first, second, and third-order impacts. The application is designed to be intuitive, fluid, and aesthetically pleasing, fostering creativity and deep strategic thinking. The core experience revolves around an infinite canvas where ideas, represented as nodes, can be created, linked, and organized in real-time, with all changes seamlessly persisted and shared among participants.

## Key Features

-   **Real-Time Collaboration**: Work with your team simultaneously on the same canvas.
-   **Infinite Canvas**: Pan and zoom freely on an infinite workspace, giving your ideas room to grow.
-   **Futures Wheel Structure**: Easily create a central idea and branch out with first, second, and third-order consequences.
-   **Interactive Node Management**: Add, edit, and connect nodes with an intuitive user interface.
-   **Persistent State**: All your work is automatically saved to the Cloudflare global network.
-   **Modern & Responsive UI**: A beautiful and functional design that works flawlessly on all devices.

## Technology Stack

This project is built with a modern, serverless-first technology stack.

**Frontend:**
-   [React](https://react.dev/)
-   [Vite](https://vitejs.dev/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [shadcn/ui](https://ui.shadcn.com/)
-   [Zustand](https://zustand-demo.pmnd.rs/) for state management
-   [@xyflow/react](https://reactflow.dev/) for the interactive canvas
-   [Framer Motion](https://www.framer.com/motion/) for animations
-   [React Router](https://reactrouter.com/) for navigation

**Backend:**
-   [Cloudflare Workers](https://workers.cloudflare.com/)
-   [Hono](https://hono.dev/)
-   [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) for state persistence

**Language:**
-   [TypeScript](https://www.typescriptlang.org/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed:
-   [Bun](https://bun.sh/)
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/axon-collective.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd axon-collective
    ```
3.  Install dependencies:
    ```sh
    bun install
    ```

## Usage

To start the development server, which includes both the Vite frontend and the Hono backend on Cloudflare Workers, run:

```sh
bun dev
```

This will start the application locally. You can access the frontend in your browser, and the backend API will be available for the frontend to consume.

## Development

-   **Frontend**: All frontend code is located in the `src` directory. Pages are in `src/pages`, and components are in `src/components`.
-   **Backend**: The Cloudflare Worker and API routes are defined in the `worker` directory. Add or modify API endpoints in `worker/user-routes.ts`.
-   **Shared Types**: To ensure type safety between the frontend and backend, all shared types are located in `shared/types.ts`.

## Deployment

This project is designed for easy deployment to the Cloudflare global network.

1.  Build the project for production:
    ```sh
    bun run build
    ```
2.  Deploy the application using Wrangler:
    ```sh
    bun run deploy
    ```

Alternatively, you can deploy directly from your GitHub repository with a single click.

[cloudflarebutton]

## License

Distributed under the MIT License. See `LICENSE` for more information.