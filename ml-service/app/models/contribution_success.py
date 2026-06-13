"""Module 2 — Contribution Success Prediction."""
import logging
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

from app.schemas.requests import ContributionRequest
from app.utils.preprocessor import extract_contribution_features

logger = logging.getLogger(__name__)
MODELS_DIR = Path("saved_models")

REPO_CATEGORIES = ["Frontend", "Backend", "Full Stack", "AI/ML", "DevOps", "Cloud"]
DIFFICULTY_SUCCESS_PENALTY = {"Easy": 0.0, "Medium": 0.15, "Hard": 0.30}

# Skill relevance per repo category (domain match bonus)
CATEGORY_SKILL_MAP = {
    "Frontend":   ["javascript", "typescript", "react", "vue", "angular", "css", "html"],
    "Backend":    ["python", "java", "go", "rust", "node.js", "express", "django", "spring"],
    "Full Stack": ["javascript", "typescript", "python", "node.js", "react", "postgresql"],
    "AI/ML":      ["python", "machine learning", "pytorch", "tensorflow", "scikit-learn", "pandas"],
    "DevOps":     ["docker", "kubernetes", "aws", "terraform", "ci/cd", "ansible"],
    "Cloud":      ["aws", "gcp", "azure", "terraform", "serverless", "docker"],
}


def _synthetic_dataset(n: int = 3000):
    rng = np.random.default_rng(42)
    X, y = [], []

    for _ in range(n):
        skill_count = rng.integers(1, 12)
        contribs = rng.integers(0, 300)
        cat_idx = rng.integers(0, 6)
        diff = rng.choice([0, 1, 2])

        cat_skill_match = rng.random()
        base_success = (
            0.30 * min(skill_count / 8, 1.0)
            + 0.30 * min(np.log1p(contribs) / np.log1p(200), 1.0)
            + 0.25 * cat_skill_match
            - 0.15 * (diff / 2)
            + rng.normal(0, 0.05)
        )
        success_pct = float(np.clip(base_success, 0.05, 0.98))

        cat_onehot = np.zeros(6)
        cat_onehot[cat_idx] = 1.0

        X.append([
            skill_count, cat_skill_match, cat_skill_match * 0.8,
            cat_skill_match * 0.5, cat_skill_match * 0.3,
            cat_skill_match * 0.2, cat_skill_match * 0.1,
            np.log1p(contribs), float(diff), *cat_onehot,
        ])
        y.append(success_pct)

    return np.array(X, dtype=np.float64), np.array(y, dtype=np.float64)


class ContributionSuccessModel:
    def __init__(self):
        MODELS_DIR.mkdir(exist_ok=True)
        self.scaler = StandardScaler()
        self.model = None
        self._load_or_train()

    def _load_or_train(self):
        model_path = MODELS_DIR / "contribution_gbr.pkl"
        scaler_path = MODELS_DIR / "contribution_scaler.pkl"

        if model_path.exists():
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            logger.info("Loaded contribution success model from disk.")
        else:
            self._train(model_path, scaler_path)

    def _train(self, model_path, scaler_path):
        logger.info("Training contribution success model...")
        X, y = _synthetic_dataset(3000)
        Xs = self.scaler.fit_transform(X)

        self.model = GradientBoostingRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.05, random_state=42
        )
        self.model.fit(Xs, y)

        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        logger.info("Contribution success model trained and saved.")

    def _skill_match_score(self, user_skills: list, repo_category: str) -> float:
        relevant = CATEGORY_SKILL_MAP.get(repo_category, [])
        if not relevant:
            return 0.0
        skill_lower = [s.lower() for s in user_skills]
        matches = sum(1 for s in skill_lower if s in relevant)
        return min(matches / max(len(relevant), 1), 1.0)

    def predict(self, req: ContributionRequest) -> dict:
        features = extract_contribution_features(
            req.user_skills, req.previous_contributions,
            req.repo_category, req.issue_difficulty,
        ).reshape(1, -1)

        Xs = self.scaler.transform(features)
        raw = float(self.model.predict(Xs)[0])
        success_pct = round(float(np.clip(raw, 0.05, 0.98)) * 100, 1)

        skill_match = self._skill_match_score(req.user_skills, req.repo_category)
        difficulty_penalty = DIFFICULTY_SUCCESS_PENALTY.get(req.issue_difficulty, 0.15)

        factors = {
            "skill_match": round(skill_match * 100, 1),
            "experience_level": min(round(np.log1p(req.previous_contributions) / np.log1p(200) * 100, 1), 100.0),
            "domain_alignment": round(skill_match * 90, 1),
            "difficulty_penalty": round(difficulty_penalty * 100, 1),
        }

        recommendation = (
            "Excellent match! You have the right skills for this issue."
            if success_pct >= 75 else
            "Good match. You may need to review some concepts first."
            if success_pct >= 50 else
            "Challenging. Consider easier issues to build experience."
        )

        return {
            "success_probability": success_pct,
            "factors": factors,
            "recommendation": recommendation,
            "skill_gaps": [
                s for s in CATEGORY_SKILL_MAP.get(req.repo_category, [])
                if s not in [sk.lower() for sk in req.user_skills]
            ][:5],
        }
