# insurlytics_demo
This project is a web-based financial tool designed to parse, analyze, and visualize data from insurance policy PDF illustrations. It transforms dense, multi-page tabular data from multiple files into a clean, interactive dashboard, allowing users to easily compare key financial metrics over time.

The application features a Ruby/Sinatra backend that serves as a PDF-parsing API and a modern React frontend that provides a responsive, state-driven user interface.

## ✨ Features

* **Dual PDF Parsing:** Upload and analyze one or two policy files simultaneously for direct comparison.
* **Interactive Dashboard:** A clean, tabbed dashboard interface (built with React) to visualize data clearly.
* **Annual Performance Chart:** A combo (bar/line) chart visualizing the **annual premium** paid vs. the **annual cash value growth**, making it easy to spot the "crossover" point where the policy's growth outpaces its cost.
* **Cumulative Value Chart:** A combo chart comparing the **total cumulative premium** paid against the **net cash value**, showing the policy's break-even point and long-term value.
* **Detailed Age Comparison:** An on-demand table that provides a side-by-side snapshot of all key metrics (cumulative premium, cash value, annual growth, etc.) at any given age.
* **Syntax-Highlighted JSON Viewer:** A collapsible accordion section to view and copy the raw parsed JSON data, complete with syntax highlighting and a "Copy to Clipboard" button.

---

## 🛠️ Tech Stack

### Frontend (Client-Side)
* **React:** Used for building the entire component-based, declarative UI.
* **Chart.js (`react-chartjs-2`):** For rendering all interactive charts.
* **JavaScript (ES6+):** For all frontend logic and state management.
* **HTML5/CSS3:** For structure and the custom "dashboard" styling.
* **`react-syntax-highlighter`:** For formatting the raw JSON output.

### Backend (Server-Side)
* **Ruby:** The core language for the backend API.
* **Sinatra:** A lightweight Ruby framework used to create the web server and API endpoints.
* **`pdf-reader`:** The key Ruby gem used to parse text and tables from the PDF documents.
* **Puma:** The web server used to run the Sinatra application.

---

## 🚀 How to Set Up the Local Testing Environment

This project is split into two parts: the backend server and the frontend client. You must run both in separate terminals for the application to work.

### Prerequisites

* **Ruby** and **Bundler:** (`gem install bundler`)
* **Node.js** and **npm:** (Download from [nodejs.org](https://nodejs.org/))

### 1. Backend Server (Terminal 1)

This terminal will run your Ruby API.

1.  Navigate to your backend project folder:
    ```bash
    cd pdf-parser-backend
    ```
2.  Install the required Ruby gems (this only needs to be done once):
    ```bash
    bundle install
    ```
3.  Start the backend server:
    ```bash
    bundle exec puma
    ```
    *You should see a message like `* Listening on http://localhost:9292`. Leave this terminal running.*

### 2. Frontend Server (Terminal 2)

This terminal will run your React development server.

1.  Navigate to your frontend project folder:
    ```bash
    cd pdf-parser-react
    ```
2.  Install the required Node modules (this only needs to be done once):
    ```bash
    npm install
    ```
3.  Start the frontend application:
    ```bash
    npm start
    ```
    *Your browser should automatically open to `http://localhost:3000`.*

### 3. You're All Set!

You can now use the application in your browser. The React app (`localhost:3000`) will send requests to the Ruby server (`localhost:9292`) when you upload a file.
