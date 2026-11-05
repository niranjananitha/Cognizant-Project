"""NVIDIA NIM chat-completions client (OpenAI-compatible API).

Credentials are read only from settings / environment (NVIDIA_API_KEY). The key is never
logged, persisted, or returned to clients. When no key is configured the service raises
`LLMNotConfiguredError` and callers fall back to retrieval-only answers."""
import json
import logging
import re
from typing import List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("medequip")


class LLMError(Exception):
    """Base class for generation failures."""


class LLMNotConfiguredError(LLMError):
    pass


class LLMUnavailableError(LLMError):
    pass


class LLMInvalidResponseError(LLMError):
    pass


class LLMService:
    provider = "nvidia"

    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None,
                 model: Optional[str] = None, timeout: Optional[float] = None,
                 max_tokens: Optional[int] = None):
        self._api_key = api_key if api_key is not None else settings.NVIDIA_API_KEY
        self.api_url = api_url or settings.NVIDIA_API_URL
        self.model = model or settings.NVIDIA_MODEL
        self.timeout = timeout or settings.NVIDIA_TIMEOUT_SECONDS
        self.max_tokens = max_tokens or settings.NVIDIA_MAX_TOKENS

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._api_key.strip())

    def chat(self, messages: List[dict], temperature: float = 0.1) -> str:
        if not self.is_configured:
            raise LLMNotConfiguredError("NVIDIA_API_KEY is not configured.")
        payload = {"model": self.model, "messages": messages, "temperature": temperature, "stream": False}
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
        headers = {"Authorization": f"Bearer {self._api_key.strip()}", "Content-Type": "application/json"}
        try:
            resp = httpx.post(self.api_url, json=payload, headers=headers, timeout=self.timeout)
        except httpx.HTTPError as exc:
            logger.warning(f"NVIDIA request failed: {type(exc).__name__}")
            raise LLMUnavailableError("The AI service could not be reached.") from exc

        if resp.status_code >= 400:
            logger.warning(f"NVIDIA returned HTTP {resp.status_code}")
            raise LLMUnavailableError(f"The AI service returned HTTP {resp.status_code}.")
        try:
            content = resp.json()["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise LLMInvalidResponseError("Unexpected response format from the AI service.") from exc
        if not isinstance(content, str):
            raise LLMInvalidResponseError("Empty response from the AI service.")
        # Reasoning models (e.g. Nemotron) may prepend a <think>...</think> trace.
        return _THINK_RE.sub("", content).strip()

    def chat_json(self, messages: List[dict]) -> dict:
        return parse_json_object(self.chat(messages))


_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


def parse_json_object(text: str) -> dict:
    """Parse the first JSON object in a model response (tolerates ```json fences)."""
    if not text:
        raise LLMInvalidResponseError("Empty response from the AI service.")
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    try:
        obj = json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end <= start:
            raise LLMInvalidResponseError("The AI response was not valid JSON.")
        try:
            obj = json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError as exc:
            raise LLMInvalidResponseError("The AI response was not valid JSON.") from exc
    if not isinstance(obj, dict):
        raise LLMInvalidResponseError("The AI response was not a JSON object.")
    return obj


_default_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """FastAPI dependency (overridable in tests)."""
    global _default_service
    if _default_service is None:
        _default_service = LLMService()
    return _default_service
