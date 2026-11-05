"""Operator-level safety guardrails for the Equipment Assistance chatbot.

These rules are applied to EVERY troubleshooting step before it reaches a nurse,
regardless of whether the step came from the LLM or was extracted from a manual."""
import re
from typing import Optional, Tuple

SAFETY_DISCLAIMER = (
    "Decision-support only. Follow only the manufacturer's operator instructions shown "
    "with their source page, your hospital's patient-care and equipment-failure "
    "procedures, and your clinical judgment. This assistant does not replace "
    "manufacturer service procedures or certified biomedical engineering support. "
    "A cleared error does not by itself confirm the device is safe to use."
)

# Hospital escalation protocol (policy text, NOT manufacturer instructions).
IF_PROBLEM_CONTINUES = [
    "Stop troubleshooting if the documented operator steps do not resolve the issue.",
    "Follow your hospital's patient-care and equipment-failure procedures; ensure the patient is safe first.",
    "Switch to approved backup equipment when required by hospital protocol.",
    "Remove the device from clinical use and label it according to hospital policy.",
    "Raise a Technical Support Request to the Biomedical Engineering Team.",
    "Do not treat the device as safe to use merely because the error message disappeared.",
]

_PROHIBITED = [
    (r"\b(open|remove|unscrew|take\s+off|pry)\b[^.\n]{0,40}\b(housing|panel|cover|casing|enclosure|chassis|back\s*plate)\b",
     "opening equipment housings or panels"),
    (r"\bdisassembl\w*|\bdismantl\w*", "disassembling the device"),
    (r"\bsolder\w*|\brewir\w*|\bjumper\w*", "electrical modification"),
    (r"\b(internal|inner)\s+(component|board|circuit|wiring|part|repair|fuse)s?\b", "internal hardware work"),
    (r"\b(replace|swap|change)\b[^.\n]{0,25}\b(fuse|circuit\s*board|pcb|motherboard|power\s+supply\s+board)\b", "internal part replacement"),
    (r"\b(bypass|override|defeat|disable|deactivate|turn\s+off)\b[^.\n]{0,30}\b(alarm|alarms|safety|interlock|sensor|limit)s?\b",
     "bypassing or disabling alarms/safety systems"),
    (r"\bpermanently\s+(silence|mute)\b|\b(silence|mute)\b[^.\n]{0,20}\bpermanently\b", "permanently silencing alarms"),
    (r"\b(service|engineering|technician|factory)\s+mode\b", "manufacturer-restricted service modes"),
    (r"\b(change|adjust|increase|decrease|alter|modify)\b[^.\n]{0,30}\b(tidal\s+volume|fio2|peep|respiratory\s+rate|infusion\s+rate|dose|dosage|"
     r"therapy\s+settings?|clinical\s+settings?|ventilation\s+settings?|energy\s+level|joules)\b",
     "changing clinical/therapy settings"),
    (r"\b(firmware|software)\s+(update|upgrade|flash|modif\w*)\b", "firmware/software modification"),
    (r"\bhigh[\s-]voltage\b|\bdischarg\w*\s+(the\s+)?capacitor", "high-voltage work"),
]
_PROHIBITED_RE = [(re.compile(p, re.IGNORECASE), label) for p, label in _PROHIBITED]

# Phrases where the manual is *warning against* an action (keep these).
_NEGATION_RE = re.compile(r"\b(do\s+not|don't|never|must\s+not|should\s+not|only\s+(qualified|authori[sz]ed|trained))\b", re.IGNORECASE)

_SAFETY_CRITICAL = re.compile(
    r"\b(smoke|smoking|burning|fire|spark\w*|electric(al)?\s+shock|shock\s+hazard|fluid\s+(ingress|spill\w*)|"
    r"liquid\s+(ingress|spill\w*)|patient\s+(harm|injur\w*|distress|desaturat\w*)|loss\s+of\s+ventilation|"
    r"ventilation\s+(stopped|failure|inoperative)|cannot\s+ventilate|apnea|apnoea|device\s+inoperative|"
    r"technical\s+fault|life[\s-]support|cardiac\s+arrest|not\s+delivering|no\s+therapy|overheat\w*)\b",
    re.IGNORECASE,
)

# Equipment categories where an unresolved fault is always at least HIGH priority.
LIFE_SUPPORT_CATEGORIES = ("ventilator", "defibrillator", "infusion", "anesthesia", "anaesthesia", "dialysis")


def check_step_safety(text: str) -> Tuple[bool, Optional[str]]:
    """Return (allowed, reason). Warnings that forbid an action are allowed."""
    if not text:
        return True, None
    for regex, label in _PROHIBITED_RE:
        for match in regex.finditer(text):
            # Allowed only when this specific phrase is negated just before it
            # ("Do not open the housing"); a negation elsewhere does not count.
            preceding = text[max(0, match.start() - 60):match.start()]
            preceding = re.split(r"[.;!?\n]", preceding)[-1]  # same sentence only
            if _NEGATION_RE.search(preceding):
                continue
            return False, label
    return True, None


def is_safety_critical(*texts: Optional[str]) -> bool:
    return any(t and _SAFETY_CRITICAL.search(t) for t in texts)


def is_life_support_category(category: Optional[str]) -> bool:
    c = (category or "").lower()
    return any(k in c for k in LIFE_SUPPORT_CATEGORIES)
