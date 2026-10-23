---
description: Build an AI assistant that answers from your product knowledge.
icon: sparkles
---

# AI ChatPrompt overview

## AI ChatPrompt

AI ChatPrompt is a documentation-first AI assistant. It retrieves verified knowledge, generates a concise answer, and cites its sources.

### Core capabilities

* Answer product questions in Bahasa Indonesia or the visitor's language.
* Use approved documentation as the primary source of truth.
* State uncertainty when no supporting source exists.

### Answer flow

1. The visitor asks a question.
2. The retrieval layer selects relevant content.
3. The model generates a grounded response.
4. The interface shows answer sources and follow-up prompts.

{% hint style="info" %}
The assistant should never invent product behavior. It must state when documentation lacks an answer.
{% endhint %}

### Next steps

{% content-ref url="quickstart.md" %}
[quickstart.md](quickstart.md)
{% endcontent-ref %}
