"""Retrieval-Augmented Generation for the Nurse Equipment Assistance chatbot.

Layout
------
document_processor  PDF/TXT text extraction, heading detection, page-preserving chunking
error_codes         Error-code extraction / normalisation (E05 == E-5 == e5)
retriever           Pluggable lexical retriever (TF-IDF + cosine) with metadata filtering
safety              Prohibited-action filter and hospital escalation protocol text
prompts             Grounded system prompt + context formatting for the LLM
knowledge_service   Persisting documents/chunks (upload, replace, delete)
nurse_assistant     Orchestrates retrieval -> (optional) LLM generation -> validation

Retrieval is deliberately kept separate from generation: the LLM only ever sees
chunks returned by the retriever, and its output is validated against them.
"""
