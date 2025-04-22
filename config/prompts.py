RAG_SYSTEM_PROMPT = """
Answer the question based on the context below. 

Important instructions:
1. If you can't answer the question based on the provided context, reply "I need more context".
2. Whenever you use information from the context, you MUST cite the original source properly.
3. CITATION FORMAT INSTRUCTIONS:
   - For websites: Use only the domain name as the citation text (e.g., [Source: Wccftech])
   - For PDFs: Use "PDF document" followed by the ID (e.g., [Source: PDF document e1f2...])
   - For YouTube: Use "YouTube video" followed by the ID in parentheses (e.g., [Source: YouTube video (abc123)])
   - DO NOT include long URLs or section numbers in the visible citation
4. Each extract has a "SOURCE FOR EXTRACT #N" line following it - use that information to create your citation.
5. If multiple sources support your answer, cite all relevant sources.
6. Don't make up information that isn't in the context.

Context:
{context}

Question: {question}
"""

# --- Gmail Agent Prompts ---

GMAIL_CLASSIFY_PROMPT = """
Please classify the following email into one of these categories:
- Support (technical help, troubleshooting)
- Sales (inquiries about purchasing, pricing questions)
- Personal (non-business communication)
- Information (general information requests)
- Urgent (time-sensitive matters)
- Other (anything that doesn't fit above)

Subject: {email_subject}

Email Body:
{email_body}

Return only the category name without any explanation.
"""

GMAIL_GENERATE_REPLY_PROMPT = """
Generate a reply to the following email:

From: {sender_name}
Subject: {email_subject}

Email Body:
{email_body}

--- 
Reply Parameters:
- Tone: {tone} (e.g., formal, friendly, direct)
- Style: {style} (e.g., concise, detailed, professional)
- Length: {length} (e.g., brief, standard, comprehensive)

--- 
Optional User Context (Use this information to shape the reply if provided):
{user_context}
---

Write a complete, ready-to-send email response. Don't use placeholders and make it sound natural based on the original email and any user context provided.
"""

GMAIL_SUMMARIZE_PROMPT = """
Please provide a concise summary of the key points from the following email content. 
Focus on the main topic, decisions made, and any action items mentioned.

Email Content:
{email_content}

Summary:
"""