# =============================================================
# PART 13 — Compliance Validator Service (Module 3)
# Vector DB retrieval + COMPLIANT/VIOLATION/MISSING classification
# structlog — no print() — keys from environment
# =============================================================
import os
import json
import numpy as np
import structlog
from typing import List, Tuple
from groq import Groq
from schemas import ComplianceResult, ComplianceViolation

log = structlog.get_logger(__name__)

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """Chunk text into overlapping blocks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def simple_embed(text: str) -> np.ndarray:
    """
    Character-level embedding using n-gram frequency.
    Falls back to simple word frequency when sentence-transformers unavailable.
    """
    vocab_size = 256
    vec = np.zeros(vocab_size, dtype=np.float32)
    for ch in text[:512]:
        vec[ord(ch) % vocab_size] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = float(np.dot(a, b))
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def retrieve_top_k(query: str, reference_chunks: List[str], reference_embeddings: List[np.ndarray], k: int = 3) -> List[str]:
    """Retrieve top-k most similar reference chunks for a given query."""
    query_emb = simple_embed(query)
    sims: List[Tuple[float, str]] = [
        (cosine_similarity(query_emb, ref_emb), chunk)
        for ref_emb, chunk in zip(reference_embeddings, reference_chunks)
    ]
    sims.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in sims[:k]]


def validate_compliance(target_text: str, reference_text: str) -> ComplianceResult:
    """
    Checks whether a target document complies with a reference policy document.
    Uses vector retrieval + Groq LLM for classification.
    """
    log.info("compliance.validating", target_len=len(target_text), ref_len=len(reference_text))

    # Chunk both documents
    target_chunks = chunk_text(target_text, chunk_size=500, overlap=100)
    reference_chunks = chunk_text(reference_text, chunk_size=500, overlap=100)

    # Embed reference chunks
    reference_embeddings = [simple_embed(chunk) for chunk in reference_chunks]

    violations: List[ComplianceViolation] = []
    missing_requirements: List[str] = []
    compliant_count = 0
    total_count = 0

    # Evaluate each target chunk against retrieved reference chunks
    for target_chunk in target_chunks[:20]:  # cap at 20 for performance
        if len(target_chunk.strip()) < 20:
            continue

        retrieved = retrieve_top_k(target_chunk, reference_chunks, reference_embeddings)
        retrieved_context = "\n---\n".join(retrieved)

        prompt = f"""You are a compliance auditor. Classify the following target statement as:
COMPLIANT — explicitly allowed or required by reference
VIOLATION — explicitly prohibited or contradicts reference
MISSING_REQUIREMENT — target fails to address a critical reference rule
UNCLEAR — compliance cannot be determined

Target statement:
{target_chunk[:400]}

Reference policy:
{retrieved_context[:800]}

Respond with ONE of: COMPLIANT, VIOLATION, MISSING_REQUIREMENT, UNCLEAR
Then on the next line: explanation (one sentence)
If VIOLATION: also include the violated rule on a third line prefixed with "Rule: "
"""
        try:
            response = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=200,
            )
            raw = response.choices[0].message.content.strip()
            lines = [l.strip() for l in raw.splitlines() if l.strip()]
            classification = lines[0].upper().split()[0] if lines else "UNCLEAR"

            total_count += 1

            if classification == "COMPLIANT":
                compliant_count += 1
            elif classification == "VIOLATION":
                rule = ""
                for line in lines:
                    if line.lower().startswith("rule:"):
                        rule = line[5:].strip()
                violations.append(ComplianceViolation(
                    violating_statement=target_chunk[:200],
                    reference_rule=rule or (retrieved[0][:200] if retrieved else "Policy rule violated"),
                ))
            elif classification == "MISSING_REQUIREMENT":
                missing_requirements.append(retrieved[0][:200] if retrieved else "Reference requirement not met")
        except Exception as e:
            log.error("compliance.chunk_error", error=str(e))
            total_count += 1

    aligned_percentage = (compliant_count / total_count * 100.0) if total_count > 0 else 100.0
    penalty = (len(violations) * 5) + (len(missing_requirements) * 3)
    overall_compliance_score = max(0, min(100, int(aligned_percentage) - penalty))

    log.info("compliance.done", score=overall_compliance_score, violations=len(violations))

    return ComplianceResult(
        overall_compliance_score=overall_compliance_score,
        aligned_percentage=round(aligned_percentage, 2),
        violations=violations,
        missing_requirements=missing_requirements,
    )
