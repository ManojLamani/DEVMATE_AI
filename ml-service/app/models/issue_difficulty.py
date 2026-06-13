"""Module 1 — Issue Difficulty Prediction (Random Forest + XGBoost ensemble)."""
import logging
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from app.schemas.requests import IssueDifficultyRequest
from app.utils.preprocessor import extract_issue_features

logger = logging.getLogger(__name__)
MODELS_DIR = Path("saved_models")
LABELS = ["Easy", "Medium", "Hard"]


def _synthetic_dataset(n_per_class: int = 1000):
    rng = np.random.default_rng(42)
    X, y = [], []

    for _ in range(n_per_class):
        # Easy
        X.append([
            rng.integers(10, 50),           # title_len
            rng.integers(0, 150),           # desc_len
            rng.integers(0, 2),             # num_labels
            rng.integers(0, 4),             # num_comments
            np.log1p(rng.integers(0, 800)), # log_stars
            np.log1p(rng.integers(50, 3000)),
            0, 0, 0.5,                      # has_code, has_trace, complexity
            rng.integers(5, 25),            # word_count
            0,                              # url_count
        ])
        y.append(0)

        # Medium
        X.append([
            rng.integers(30, 100),
            rng.integers(80, 700),
            rng.integers(1, 4),
            rng.integers(3, 18),
            np.log1p(rng.integers(400, 8000)),
            np.log1p(rng.integers(500, 40000)),
            int(rng.random() > 0.5), int(rng.random() > 0.7), 1.5,
            rng.integers(20, 90),
            rng.integers(0, 3),
        ])
        y.append(1)

        # Hard
        X.append([
            rng.integers(60, 200),
            rng.integers(400, 3000),
            rng.integers(2, 7),
            rng.integers(8, 50),
            np.log1p(rng.integers(3000, 100000)),
            np.log1p(rng.integers(5000, 500000)),
            1, 1, 2.5,
            rng.integers(70, 400),
            rng.integers(1, 8),
        ])
        y.append(2)

    return np.array(X, dtype=np.float64), np.array(y)


class IssueDifficultyModel:
    def __init__(self):
        MODELS_DIR.mkdir(exist_ok=True)
        self.scaler = StandardScaler()
        self.rf = None
        self.xgb = None
        self._load_or_train()

    def _load_or_train(self):
        rf_path = MODELS_DIR / "issue_rf.pkl"
        xgb_path = MODELS_DIR / "issue_xgb.pkl"
        scaler_path = MODELS_DIR / "issue_scaler.pkl"

        if rf_path.exists() and xgb_path.exists():
            self.rf = joblib.load(rf_path)
            self.xgb = joblib.load(xgb_path)
            self.scaler = joblib.load(scaler_path)
            logger.info("Loaded issue difficulty models from disk.")
        else:
            self._train(rf_path, xgb_path, scaler_path)

    def _train(self, rf_path, xgb_path, scaler_path):
        logger.info("Training issue difficulty models...")
        X, y = _synthetic_dataset(1000)
        Xs = self.scaler.fit_transform(X)

        self.rf = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42, n_jobs=-1)
        self.rf.fit(Xs, y)

        self.xgb = XGBClassifier(
            n_estimators=150, max_depth=6, learning_rate=0.1,
            random_state=42, eval_metric="mlogloss", verbosity=0,
        )
        self.xgb.fit(Xs, y)

        joblib.dump(self.rf, rf_path)
        joblib.dump(self.xgb, xgb_path)
        joblib.dump(self.scaler, scaler_path)
        logger.info("Issue difficulty models trained and saved.")

    def predict(self, req: IssueDifficultyRequest) -> dict:
        features = extract_issue_features(
            req.title, req.description or "", req.labels,
            req.num_comments, req.repo_stars, req.repo_size,
        ).reshape(1, -1)

        Xs = self.scaler.transform(features)
        rf_proba = self.rf.predict_proba(Xs)[0]
        xgb_proba = self.xgb.predict_proba(Xs)[0]
        ensemble = (rf_proba + xgb_proba) / 2
        idx = int(np.argmax(ensemble))

        return {
            "difficulty": LABELS[idx],
            "confidence": round(float(ensemble[idx]), 4),
            "probabilities": {
                "Easy": round(float(ensemble[0]), 4),
                "Medium": round(float(ensemble[1]), 4),
                "Hard": round(float(ensemble[2]), 4),
            },
            "rf_prediction": LABELS[int(self.rf.predict(Xs)[0])],
            "xgb_prediction": LABELS[int(self.xgb.predict(Xs)[0])],
            "feature_importance": {
                name: round(float(imp), 4)
                for name, imp in zip(
                    ["title_len", "desc_len", "num_labels", "num_comments",
                     "log_stars", "log_size", "has_code", "has_trace",
                     "label_complexity", "word_count", "url_count"],
                    self.rf.feature_importances_,
                )
            },
        }
