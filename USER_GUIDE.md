# User Guide

Welcome to **BioDockify**. This guide will help you navigate the interface and conduct your first automated research campaign.

---

## 1. Application Layout

### The Dashboard
Upon launching, you are greeted by the Dashboard.
*   **Quick Stats:** View the number of processed papers, extracted entities, and mapped relationships.
*   **Recent Activity:** Specific research queries you have run recently.

### The Research Tab
This is the main workspace.
*   **Query Bar:** The natural language input field ("Agent Input").
*   **Real-time Log:** A console showing "Agent Zero's" thought process (e.g., *[Thinking] Searching for PDFs...*).
*   **Graph View:** An interactive node-link visualization of the knowledge graph.

### The Lab Interface
(Advanced) Tools for generating specific chemical reports and structural analysis.

---

## 2. Conducting a Research Campaign

### Step 1: Input Data
BioDockify needs literature to analyze.
1.  Place your PDF files into the `data/` folder (or use the "Upload" button if available).
2.  Alternatively, the Agent can search PubMed/ArXiv if configured with an API key.

### Step 2: Run a Query
1.  Go to the **Research** tab.
2.  Type a command. Examples:
    *   *"Read all the PDFs in the data folder and map the interactions of Tau protein."*
    *   *"Summarize the relationship between Aspirin and COX-2 based on the known graph."*
3.  Press **Enter**.

### Step 3: Monitor Execution
*   The Agent will parse the request.
*   It may spin up sub-agents (BioNER Agent) to read files.
*   You will see the Knowledge Graph grow in real-time as entities are found.

### Step 4: Analyze Results
1.  **Graph Exploration:** Click on nodes in the graph to see their details and source sentences.
2.  **Reports:** Once finished, the Agent generates a Markdown report. Click "Download Report" to save it.

---

## 3. Advanced Features

### Editing the Graph
*   You can manually delete incorrect edges or merge nodes if the AI made a mistake.
*   Right-click a node > "Edit" / "Delete".

### Exporting Data
*   **BibTeX:** Export citations for your manuscript.
*   **CSV/JSON:** Export the raw graph data for use in other tools (Gephi, Cytoscape).
