"""Module 6 — Developer Recommendation Engine."""
import logging
from typing import Any, Dict, List

import numpy as np

from app.schemas.requests import RecommendationRequest

logger = logging.getLogger(__name__)

CATEGORY_SKILL_MAP: Dict[str, List[str]] = {
    "Frontend":   ["javascript", "typescript", "react", "vue", "angular", "css", "html", "tailwind"],
    "Backend":    ["python", "java", "go", "rust", "node.js", "express", "django", "spring", "fastapi"],
    "Full Stack": ["javascript", "typescript", "python", "node.js", "react", "postgresql", "prisma"],
    "AI/ML":      ["python", "machine learning", "pytorch", "tensorflow", "scikit-learn", "pandas", "nlp"],
    "DevOps":     ["docker", "kubernetes", "aws", "terraform", "ci/cd", "ansible", "shell"],
    "Cloud":      ["aws", "gcp", "azure", "terraform", "serverless", "docker", "go"],
}

LEARNING_ROADMAPS: Dict[str, List[str]] = {
    "Frontend": [
        "Master HTML, CSS, and JavaScript fundamentals",
        "Learn React or Vue.js framework",
        "Understand TypeScript",
        "Study accessibility and performance optimization",
        "Explore Next.js or Nuxt.js for SSR",
    ],
    "Backend": [
        "Pick a language: Python, Go, or Java",
        "Learn REST API design principles",
        "Study databases: SQL + one NoSQL",
        "Understand authentication and security",
        "Explore microservices and message queues",
    ],
    "Full Stack": [
        "Build solid Frontend skills (React/Vue)",
        "Learn a Backend framework (Express, FastAPI)",
        "Study databases (PostgreSQL, Redis)",
        "Understand DevOps basics (Docker, CI/CD)",
        "Build and deploy a full-stack project",
    ],
    "AI/ML": [
        "Master Python and NumPy/Pandas",
        "Learn statistics and linear algebra",
        "Study scikit-learn for classical ML",
        "Explore deep learning with PyTorch",
        "Practice on Kaggle datasets",
    ],
    "DevOps": [
        "Learn Linux and shell scripting",
        "Master Docker and containerization",
        "Study Kubernetes orchestration",
        "Set up CI/CD pipelines (GitHub Actions)",
        "Learn Infrastructure as Code (Terraform)",
    ],
    "Cloud": [
        "Get certified on AWS or GCP",
        "Learn serverless architecture",
        "Study cloud networking and security",
        "Explore managed services (RDS, Pub/Sub)",
        "Practice with Terraform for IaC",
    ],
}


def _skill_score(user_skills: List[str], required_skills: List[str]) -> float:
    skill_lower = {s.lower() for s in user_skills}
    if not required_skills:
        return 0.0
    return sum(1 for s in required_skills if s.lower() in skill_lower) / len(required_skills)


def _infer_category(topics: List[str], languages: Dict[str, Any]) -> str:
    text = " ".join(topics).lower()
    lang_keys = [k.lower() for k in languages.keys()] if isinstance(languages, dict) else []

    if any(k in text for k in ["machine-learning", "ai", "nlp", "deep-learning"]):
        return "AI/ML"
    if any(k in text for k in ["docker", "kubernetes", "devops", "ci", "cd"]):
        return "DevOps"
    if any(k in text for k in ["aws", "cloud", "serverless", "lambda"]):
        return "Cloud"
    if "python" in lang_keys and "javascript" not in lang_keys:
        return "Backend"
    if "javascript" in lang_keys and "python" not in lang_keys:
        return "Frontend"
    return "Full Stack"


def _difficulty_label(issue: Dict[str, Any]) -> str:
    labels = [l.lower() for l in (issue.get("labels") or [])]
    if any(l in labels for l in ["good first issue", "beginner", "starter"]):
        return "Easy"
    if any(l in labels for l in ["security", "critical", "performance"]):
        return "Hard"
    return "Medium"


class RecommendationEngine:
    def recommend(self, req: RecommendationRequest) -> dict:
        skill_lower = {s.lower() for s in req.user_skills}
        preferred_lower = {l.lower() for l in req.preferred_languages}
        exp_level = min(req.contribution_count / 50, 1.0)  # 0–1 scale

        # Determine dominant skill area
        best_cat = max(
            CATEGORY_SKILL_MAP,
            key=lambda cat: _skill_score(req.user_skills, CATEGORY_SKILL_MAP[cat]),
        )

        # Score repositories
        repo_scores = []
        for repo in req.repositories:
            cat = repo.get("cluster") or _infer_category(
                repo.get("topics", []), repo.get("languages", {})
            )
            skill_match = _skill_score(req.user_skills, CATEGORY_SKILL_MAP.get(cat, []))
            lang_match = sum(
                1 for l in (repo.get("languages", {}) or {})
                if l.lower() in preferred_lower
            ) / max(len(preferred_lower), 1)

            stars = int(repo.get("stars", 0))
            star_score = min(np.log1p(stars) / np.log1p(10000), 1.0)

            # Beginners → smaller repos; advanced → larger
            size_fit = 1.0 - abs(exp_level - star_score)

            score = 0.45 * skill_match + 0.25 * lang_match + 0.20 * size_fit + 0.10 * star_score

            reasons = []
            if skill_match > 0.5:
                reasons.append(f"Strong skill alignment with {cat}")
            if lang_match > 0.3:
                reasons.append(f"Uses your preferred languages")
            if size_fit > 0.7:
                reasons.append("Matches your experience level")

            repo_scores.append({
                "id": repo.get("id"),
                "name": repo.get("name", ""),
                "full_name": repo.get("fullName", ""),
                "cluster": cat,
                "score": round(float(score), 4),
                "match_percentage": round(float(score) * 100, 1),
                "reasons": reasons or ["Broad tech overlap"],
            })

        # Score issues
        issue_scores = []
        for issue in req.issues:
            diff = _difficulty_label(issue)
            diff_fit = (
                1.0 if (exp_level < 0.3 and diff == "Easy") else
                1.0 if (0.3 <= exp_level < 0.7 and diff == "Medium") else
                1.0 if (exp_level >= 0.7 and diff == "Hard") else 0.5
            )
            repo_cat = issue.get("repo_cluster", best_cat)
            skill_match = _skill_score(req.user_skills, CATEGORY_SKILL_MAP.get(repo_cat, []))
            score = 0.5 * diff_fit + 0.5 * skill_match

            issue_scores.append({
                "id": issue.get("id"),
                "title": issue.get("title", ""),
                "difficulty": diff,
                "score": round(float(score), 4),
                "match_percentage": round(float(score) * 100, 1),
                "reasons": [
                    f"Difficulty ({diff}) matches your experience",
                    f"Skill alignment with {repo_cat}",
                ],
            })

        top_repos = sorted(repo_scores, key=lambda x: x["score"], reverse=True)[:5]
        top_issues = sorted(issue_scores, key=lambda x: x["score"], reverse=True)[:5]
        roadmap = LEARNING_ROADMAPS.get(best_cat, LEARNING_ROADMAPS["Full Stack"])

        # Identify skill gaps
        all_relevant = CATEGORY_SKILL_MAP.get(best_cat, [])
        skill_gaps = [s for s in all_relevant if s not in skill_lower][:5]

        return {
            "top_repositories": top_repos,
            "top_issues": top_issues,
            "learning_roadmap": {
                "category": best_cat,
                "steps": roadmap,
                "skill_gaps": skill_gaps,
                "next_milestone": roadmap[min(int(exp_level * len(roadmap)), len(roadmap) - 1)],
            },
            "profile_summary": {
                "dominant_category": best_cat,
                "experience_level": (
                    "Beginner" if exp_level < 0.3 else
                    "Intermediate" if exp_level < 0.7 else "Advanced"
                ),
                "skill_count": len(req.user_skills),
                "contribution_count": req.contribution_count,
            },
        }
