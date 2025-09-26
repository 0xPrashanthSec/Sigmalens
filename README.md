# SigmaLens

A minimalist and visually stunning web application to convert Sigma rules into Kibana (Elasticsearch DSL) queries.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/0xPrashanthSec/Sigmalense)

SigmaLens is a visually stunning, minimalist web application designed for security analysts and engineers. It provides a streamlined interface to convert Sigma rules, written in YAML, into executable Kibana queries using the Elasticsearch DSL (ECS standard). The application features a clean, two-panel layout: one for inputting Sigma rules (either by pasting text or uploading a .yml file) and another for displaying the generated query. Both panels feature professional syntax highlighting to enhance readability. The core focus is on providing a fast, beautiful, and intuitive tool that simplifies a common workflow in security operations.

## Key Features

-   **Paste or Upload:** Easily input Sigma rules by pasting raw YAML or uploading `.yml` files.
-   **Instant Conversion:** Convert Sigma rules into Elasticsearch DSL (ECS standard) for use in Kibana.
-   **Syntax Highlighting:** Enhanced readability for both YAML input and JSON output.
-   **Minimalist UI:** A clean, intuitive, and responsive two-panel layout for a seamless user experience.
-   **Copy to Clipboard:** Quickly copy the generated query with a single click.
-   **Built for Speed:** A fast, lightweight frontend coupled with a high-performance Cloudflare Worker backend.

## Technology Stack

-   **Frontend:**
    -   React (with Vite)
    -   TypeScript
    -   Tailwind CSS
    -   shadcn/ui
    -   Framer Motion
    -   Lucide React
    -   React Syntax Highlighter
    -   React Dropzone
-   **Backend:**
    -   Cloudflare Workers
    -   Hono
-   **Package Manager:**
    -   Bun

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [Bun](https://bun.sh/) package manager

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/sigmalens.git
    cd sigmalens
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Run the development server:**
    This command starts the Vite frontend and the Wrangler development server for the Cloudflare Worker backend simultaneously.
    ```bash
    bun dev
    ```

The application should now be running on `http://localhost:3000`.

## Usage

1.  Navigate to the application in your browser.
2.  You will see two panels: "Sigma Rule (YAML)" on the left and "Kibana Query (DSL)" on the right.
3.  **Input your rule:**
    -   Click on the "Paste Text" tab and paste your YAML content directly into the text area.
    -   Alternatively, click the "Upload File" tab to drag and drop a `.yml` file or click to select one.
4.  **Convert:**
    -   Click the central "Convert" button.
5.  **Get the result:**
    -   The generated Kibana query will appear in the right-hand panel with syntax highlighting.
    -   Click the copy icon in the top-right corner of the output panel to copy the query to your clipboard.

## Development

The project is structured as a monorepo with the frontend and backend code separated.

-   **Frontend:** The React application code is located in the `src/` directory. The main application view is `src/pages/HomePage.tsx`.
-   **Backend:** The Cloudflare Worker code, built with Hono, is in the `worker/` directory. API routes are defined in `worker/user-routes.ts`. The primary endpoint for this application is `POST /api/convert`.

## Deployment

This application is designed for easy deployment to Cloudflare's global network.

1.  **Login to Cloudflare:**
    If you haven't already, log in to your Cloudflare account via the command line.
    ```bash
    bun wrangler login
    ```

2.  **Build and Deploy:**
    Run the deploy script, which will build the Vite application and deploy it along with the worker.
    ```bash
    bun deploy
    ```

Wrangler will provide you with the URL of your deployed application.

Alternatively, deploy directly from your GitHub repository with a single click:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/0xPrashanthSec/Sigmalense)

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.