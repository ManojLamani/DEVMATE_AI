"""Module 5 — AI Repository Explainer (Claude API)."""
import logging
import os

import anthropic

from app.schemas.requests import RepoExplainerRequest

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert software architect. Analyze a GitHub repository and return a
structured JSON explanation. Be concise and developer-focused. Return ONLY valid JSON, no markdown."""

USER_TEMPLATE = """Repository: {name}
Description: {description}
Topics: {topics}
Languages: {languages}
Stars: {stars} | Forks: {forks}
Key files/folders: {file_tree}
README excerpt: {readme}

Return this exact JSON structure:
{{
  "summary": "2-3 sentence project overview",
  "type": "one of: Frontend, Backend, Full Stack, AI/ML, DevOps, Cloud, Library, Tool",
  "architecture": "2-3 sentences about architecture patterns used",
  "tech_stack": ["list", "of", "key", "technologies"],
  "important_folders": [
    {{"path": "folder/path", "purpose": "what it contains"}}
  ],
  "starting_files": [
    {{"file": "filename", "reason": "why to read this first"}}
  ],
  "complexity": "Beginner | Intermediate | Advanced",
  "contribution_tips": ["tip1", "tip2", "tip3"]
}}"""


class RepoExplainer:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self._client = anthropic.AsyncAnthropic(api_key=api_key) if api_key else None
        if not self._client:
            logger.warning("ANTHROPIC_API_KEY not set — repo explainer will use fallback.")

    async def explain(self, req: RepoExplainerRequest) -> dict:
        if self._client:
            return await self._explain_with_claude(req)
        return self._fallback_explanation(req)

    async def _explain_with_claude(self, req: RepoExplainerRequest) -> dict:
        import json

        lang_str = ", ".join(f"{k} ({v:.0f}%)" for k, v in list(req.languages.items())[:5])
        file_tree_str = "\n".join(req.file_tree[:20]) if req.file_tree else "Not provided"
        readme_excerpt = (req.readme or "")[:800]

        prompt = USER_TEMPLATE.format(
            name=req.name,
            description=req.description or "No description",
            topics=", ".join(req.topics) or "None",
            languages=lang_str or "Unknown",
            stars=req.stars,
            forks=req.forks,
            file_tree=file_tree_str,
            readme=readme_excerpt or "No README",
        )

        try:
            message = await self._client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            content = message.content[0].text.strip()
            # Strip markdown fences if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content)
        except Exception as exc:
            logger.error("Claude API error: %s", exc)
            return self._fallback_explanation(req)

    def _fallback_explanation(self, req: RepoExplainerRequest) -> dict:
        """Rule-based fallback when Claude API is unavailable."""
        langs = list(req.languages.keys())
        topics_lower = [t.lower() for t in req.topics]

        # Infer type
        repo_type = "Full Stack"
        if any(t in topics_lower for t in ["machine-learning", "ai", "nlp", "deep-learning"]):
            repo_type = "AI/ML"
        elif any(t in topics_lower for t in ["docker", "kubernetes", "ci", "devops"]):
            repo_type = "DevOps"
        elif any(l in langs for l in ["JavaScript", "TypeScript", "HTML", "CSS"]) and \
             not any(l in langs for l in ["Python", "Java", "Go"]):
            repo_type = "Frontend"
        elif any(l in langs for l in ["Python", "Java", "Go", "Rust"]) and \
             not any(l in langs for l in ["JavaScript", "HTML"]):
            repo_type = "Backend"

        complexity = (
            "Advanced" if req.stars > 5000 else
            "Intermediate" if req.stars > 500 else "Beginner"
        )

        return {
            "summary": f"{req.name} is a {repo_type} project. {req.description or 'No description provided.'}",
            "type": repo_type,
            "architecture": f"Built primarily with {', '.join(langs[:3]) or 'unknown languages'}. "
                            f"Topics include {', '.join(req.topics[:4]) or 'none specified'}.",
            "tech_stack": langs[:6] + req.topics[:4],
            "important_folders": [
                {"path": "src/", "purpose": "Main source code"},
                {"path": "tests/", "purpose": "Test suite"},
                {"path": "docs/", "purpose": "Documentation"},
            ],
            "starting_files": [
                {"file": "README.md", "reason": "Project overview and setup instructions"},
                {"file": "package.json / requirements.txt", "reason": "Dependencies and scripts"},
            ],
            "complexity": complexity,
            "contribution_tips": [
                "Read the README and CONTRIBUTING.md first",
                "Look for issues tagged 'good first issue'",
                "Run tests before submitting a PR",
            ],
        }
