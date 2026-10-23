---
description: Configure an AI ChatPrompt assistant for accurate product answers.
icon: rocket
---

# Quickstart

## Quickstart

Create useful answers by preparing a trusted knowledge base before enabling chat.

{% stepper %}
{% step %}
### Add source content

Document product features, limits, setup steps, and error messages. Use one topic per page.
{% endstep %}

{% step %}
### Enable the assistant

In the site sidebar, open **Customize → AI Assistant**. Enable the assistant and choose **Sidebar** for a full chat experience.
{% endstep %}

{% step %}
### Add answer instructions

Use the instruction block below. It keeps responses grounded in published knowledge.

```
Answer only from approved documentation and connected sources.
Use clear Bahasa Indonesia unless the visitor uses another language.
State when the answer is unavailable or uncertain.
Do not invent product capabilities, prices, policies, or technical details.
Cite relevant documentation sources when available.
```
{% endstep %}

{% step %}
### Test real questions

Test setup, troubleshooting, and policy questions. Confirm every answer cites the right page.
{% endstep %}
{% endstepper %}

{% hint style="warning" %}
A chat assistant cannot provide reliable answers until its source documentation exists and is searchable.
{% endhint %}
