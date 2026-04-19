# =============================================================
# PART 13 — Text Forensics Service
# Expert forensic document examiner — JSON output only
# Returns ForensicTextResult schema
# Uses structlog — no print() statements
# =============================================================
import json
import os
import structlog
from groq import Groq
from schemas import ForensicTextResult

log = structlog.get_logger(__name__)

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])

SYSTEM_PROMPT = """You are an expert forensic document examiner specializing in fraud detection.
For every document analyzed, perform the following analysis:
1. Textual Inconsistencies: Unnatural phrasing, abrupt style changes, impossible date sequences, contradictory statements
2. Anomaly Detection: Unusual data formatting, impossible mathematical totals, mismatched entities, font inconsistencies
3. AI Generation Signals: Generic/overly formal/repetitive tone typical of LLMs, lack of specific verifiable details
4. Metadata Analysis: Inconsistencies in author names, creation dates, editing software vs. purported origin

Return ONLY a JSON object matching this schema exactly — no other text:
{
  "authenticity_score": <integer 0-100>,
  "tampering_risk": <"low"|"medium"|"high">,
  "ai_generated_likelihood": <"low"|"medium"|"high">,
  "verdict": <"Likely Authentic"|"Suspicious - Requires Review"|"Likely Forged">,
  "key_reasons": [<string>, ...],
  "flagged_passages": [<string>, ...]
}"""


def analyze_text_forensics(document_text: str, metadata: dict, model: str = "llama3-70b-8192") -> ForensicTextResult:
    """
    Sends document text to Groq for forensic analysis.
    Returns ForensicTextResult with real analysis — no mocks.
    """
    log.info("text_forensics.analyzing", text_length=len(document_text), model=model)

    meta_str = "\n".join(f"{k}: {v}" for k, v in metadata.items())
    user_content = f"Document metadata:\n{meta_str}\n\nDocument text:\n{document_text[:6000]}"

    try:
        response = groq_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.1,
            max_tokens=800,
        )

        raw = response.choices[0].message.content.strip()

        # Extract JSON block if wrapped in markdown
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        data = json.loads(raw)
        result = ForensicTextResult(**data)
        log.info("text_forensics.complete", verdict=result.verdict, score=result.authenticity_score)
        return result

    except json.JSONDecodeError as e:
        log.error("text_forensics.json_parse_error", error=str(e))
        return ForensicTextResult(
            authenticity_score=50,
            tampering_risk="medium",
            ai_generated_likelihood="low",
            verdict="Suspicious - Requires Review",
            key_reasons=["Analysis parsing failed — manual review required"],
            flagged_passages=[],
        )
    except Exception as e:
        log.error("text_forensics.error", error=str(e))
        raise
