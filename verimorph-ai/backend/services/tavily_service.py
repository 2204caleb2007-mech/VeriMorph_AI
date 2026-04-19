# =============================================================
# PART 13 — Tavily Search Service
# Live web search for suggested questions
# Keys from environment — no hardcoding
# structlog — no print()
# =============================================================
import os
import structlog
from tavily import TavilyClient

log = structlog.get_logger(__name__)

tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])


def search_tavily(query: str) -> dict:
    """
    Searches Tavily with advanced depth and returns answer + sources.
    """
    log.info("tavily.search", query=query[:100])

    results = tavily_client.search(
        query=query,
        search_depth="advanced",
        max_results=5,
        include_answer=True,
    )

    context_block = f"Answer: {results.get('answer', '')}\n\n"
    for r in results.get("results", []):
        context_block += f"Source: {r['url']}\n{r['content']}\n\n"

    log.info("tavily.done", num_results=len(results.get("results", [])))

    return {
        "query": query,
        "answer": results.get("answer", ""),
        "sources": results.get("results", []),
        "context_block": context_block,
    }
