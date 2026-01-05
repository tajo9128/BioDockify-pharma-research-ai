# Ethics and Limitations

In compliance with principles of Responsible AI, we disclose the following ethical considerations and technical limitations of BioDockify.

## 1. AI Hallucination & Accuracy
*   **Nature:** Large Language Models (LLMs) used for report generation are probabilistic. While our GraphRAG architecture grounds outputs in retrieved data, **hallucinations (fabrications) are still possible**, especially when synthesizing abstract concepts.
*   **Mitigation:** All claims in generated reports include citation pointers. Users **must click** these citations to verify the statement against the source text.

## 2. Dataset Bias
*   **Literature Bias:** The system's knowledge is limited to the documents provided by the user and the training data of the underlying models (BioBERT). It may reflect historical biases present in Western biomedical literature.
*   **Entity Recognition:** The BioNER model performs best on English-language texts. Performance on non-English documents or highly specialized niche domains (e.g., rare tropical diseases) may degrade.

## 3. Dual-Use Concerns
*   **Scope:** BioDockify is optimized for therapeutic discovery (finding cures).
*   **Risk:** Like any powerful chemical discovery tool, it could theoretically be misused to identify toxic compounds. We have implemented safety rails where possible, but the ultimate responsibility lies with the user.
*   **Policy:** We strictly prohibit the use of this software for the design of chemical weapons or harmful agents.

## 4. Computation limits
*   **Local Hardware:** Being a local-first application, performance is strictly bound by the user's hardware. Processing thousands of PDFs requires significant RAM and CPU/GPU resources.
