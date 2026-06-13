"""Module 3 — Repository Clustering (K-Means + PCA)."""
import logging
from pathlib import Path
from typing import List

import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from app.schemas.requests import RepoClusterRequest
from app.utils.preprocessor import (
    extract_repo_features, REPO_CATEGORIES, ALL_LANGUAGES,
    LANGUAGE_CLUSTER_WEIGHTS, TOPIC_KEYWORDS,
)

logger = logging.getLogger(__name__)
MODELS_DIR = Path("saved_models")
N_CLUSTERS = len(REPO_CATEGORIES)  # 6


def _synthetic_repo_dataset(n_per_cluster: int = 200):
    rng = np.random.default_rng(42)
    X, y = [], []

    cluster_profiles = {
        "Frontend":   {"langs": ["JavaScript", "TypeScript", "HTML", "CSS"], "topics": ["react", "vue", "ui", "frontend"]},
        "Backend":    {"langs": ["Python", "Java", "Go", "Rust"], "topics": ["api", "backend", "server", "microservice"]},
        "Full Stack": {"langs": ["JavaScript", "TypeScript", "Python"], "topics": ["fullstack", "mern", "nextjs"]},
        "AI/ML":      {"langs": ["Python", "R"], "topics": ["machine-learning", "ai", "nlp", "deep-learning"]},
        "DevOps":     {"langs": ["Shell", "Dockerfile", "HCL"], "topics": ["docker", "kubernetes", "ci", "devops"]},
        "Cloud":      {"langs": ["TypeScript", "Python", "HCL"], "topics": ["cloud", "aws", "serverless", "lambda"]},
    }

    for cat, profile in cluster_profiles.items():
        for _ in range(n_per_cluster):
            langs = {}
            primary = str(rng.choice(profile["langs"]))
            langs[primary] = float(rng.integers(40, 80))
            if len(profile["langs"]) > 1:
                secondary = str(rng.choice([l for l in profile["langs"] if l != primary]))
                langs[secondary] = float(rng.integers(10, 40))

            topics = [str(t) for t in rng.choice(profile["topics"], size=min(3, len(profile["topics"])), replace=False)]
            noise_topics = ["readme", "open-source", "github"]
            topics += [str(rng.choice(noise_topics))]

            features = extract_repo_features(
                name=f"{cat.lower()}-project",
                description=f"A {cat} project for {str(rng.choice(profile['topics']))}",
                topics=topics,
                languages=langs,
                stars=int(rng.integers(0, 5000)),
                size=int(rng.integers(100, 50000)),
                open_issues=int(rng.integers(0, 200)),
            )
            X.append(features)
            y.append(REPO_CATEGORIES.index(cat))

    return np.array(X, dtype=np.float64), np.array(y)


class RepoClusteringModel:
    def __init__(self):
        MODELS_DIR.mkdir(exist_ok=True)
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=2, random_state=42)
        self.kmeans = None
        self._cluster_centers_labels: List[str] = []
        self._viz_data: list = []
        self._load_or_train()

    def _load_or_train(self):
        km_path = MODELS_DIR / "repo_kmeans.pkl"
        scaler_path = MODELS_DIR / "repo_cluster_scaler.pkl"
        pca_path = MODELS_DIR / "repo_pca.pkl"
        labels_path = MODELS_DIR / "repo_cluster_labels.pkl"
        viz_path = MODELS_DIR / "repo_viz_data.pkl"

        if km_path.exists():
            self.kmeans = joblib.load(km_path)
            self.scaler = joblib.load(scaler_path)
            self.pca = joblib.load(pca_path)
            self._cluster_centers_labels = joblib.load(labels_path)
            self._viz_data = joblib.load(viz_path) if viz_path.exists() else []
            logger.info("Loaded repo clustering model from disk.")
        else:
            self._train(km_path, scaler_path, pca_path, labels_path, viz_path)

    def _train(self, km_path, scaler_path, pca_path, labels_path, viz_path):
        logger.info("Training repo clustering model...")
        X, y = _synthetic_repo_dataset(200)
        Xs = self.scaler.fit_transform(X)

        self.kmeans = KMeans(n_clusters=N_CLUSTERS, n_init=20, random_state=42)
        self.kmeans.fit(Xs)

        # Map cluster IDs to category labels by majority vote
        from collections import Counter
        label_map = {}
        for cluster_id in range(N_CLUSTERS):
            mask = self.kmeans.labels_ == cluster_id
            majority = Counter(y[mask].tolist()).most_common(1)[0][0]
            label_map[cluster_id] = REPO_CATEGORIES[majority]
        self._cluster_centers_labels = [label_map[i] for i in range(N_CLUSTERS)]

        self.pca.fit(Xs)
        self._build_viz(X, y, Xs)

        joblib.dump(self.kmeans, km_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.pca, pca_path)
        joblib.dump(self._cluster_centers_labels, labels_path)
        joblib.dump(self._viz_data, viz_path)
        logger.info("Repo clustering model trained and saved.")

    def _build_viz(self, X_raw, y_raw, Xs):
        coords = self.pca.transform(Xs)
        self._viz_data = [
            {
                "x": round(float(coords[i, 0]), 3),
                "y": round(float(coords[i, 1]), 3),
                "cluster": REPO_CATEGORIES[int(y_raw[i])],
                "predicted": self._cluster_centers_labels[int(self.kmeans.labels_[i])],
            }
            for i in range(len(X_raw))
        ]

    def _predict_single(self, req: RepoClusterRequest) -> dict:
        features = extract_repo_features(
            req.name, req.description or "", req.topics,
            req.languages, req.stars, req.size, req.open_issues,
        ).reshape(1, -1)

        Xs = self.scaler.transform(features)
        cluster_id = int(self.kmeans.predict(Xs)[0])
        label = self._cluster_centers_labels[cluster_id]

        distances = np.linalg.norm(self.kmeans.cluster_centers_ - Xs, axis=1)
        scores = 1 / (1 + distances)
        confidence = float(scores[cluster_id] / scores.sum())

        pca_coords = self.pca.transform(Xs)[0]

        return {
            "repo_id": req.repo_id,
            "cluster": label,
            "confidence": round(confidence, 4),
            "pca_x": round(float(pca_coords[0]), 3),
            "pca_y": round(float(pca_coords[1]), 3),
            "all_scores": {
                self._cluster_centers_labels[i]: round(float(scores[i] / scores.sum()), 4)
                for i in range(N_CLUSTERS)
            },
        }

    def predict(self, req: RepoClusterRequest) -> dict:
        return self._predict_single(req)

    def predict_batch(self, repos: List[RepoClusterRequest]) -> list:
        return [self._predict_single(r) for r in repos]

    def get_visualization_data(self) -> list:
        return self._viz_data
