---
description: Reference architecture for retrieval-grounded AI answers.
icon: microchip
---

# AI model engine

## AI model engine

The AI engine combines retrieval, a language model, and answer controls. This design reduces unsupported answers.

### Architecture

```
Visitor question
  → Query understanding
  → Retrieval and ranking
  → Context validation
  → Language model generation
  → Safety checks and citations
  → Answer
```

### Components

| Component       | Responsibility                                           |
| --------------- | -------------------------------------------------------- |
| Knowledge index | Stores searchable, approved product content.             |
| Retriever       | Selects the most relevant source passages.               |
| Ranker          | Prioritizes current, precise, and authoritative sources. |
| Model           | Creates a clear answer from retrieved context.           |
| Guardrails      | Reject unsupported claims and sensitive requests.        |

### Grounding rules

1. Answer only when retrieved evidence supports the claim.
2. Ask a clarifying question when the request is ambiguous.
3. Return an explicit fallback when no source supports the answer.

{% hint style="success" %}
Source citations make answers auditable. Keep the original documentation current.
{% endhint %}
