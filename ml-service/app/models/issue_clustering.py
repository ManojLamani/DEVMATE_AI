"""Module 4 — Issue Clustering (TF-IDF + K-Means)."""
import logging
import re
from pathlib import Path
from typing import List

import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

from app.schemas.requests import IssueClusterRequest

logger = logging.getLogger(__name__)
MODELS_DIR = Path("saved_models")

ISSUE_CATEGORIES = ["Bug", "Documentation", "Feature Request", "Security", "Testing"]
N_CLUSTERS = len(ISSUE_CATEGORIES)

CATEGORY_SEEDS = {
    "Bug": [
        "fix bug error exception crash null pointer undefined traceback failure",
        "regression broken not working unexpected behavior",
        "infinite loop memory leak stack overflow segfault",
    ],
    "Documentation": [
        "docs documentation readme update missing example tutorial guide",
        "typo spelling unclear description explanation how to",
        "api reference comment javadoc docstring",
    ],
    "Feature Request": [
        "feature request add new implement support enhancement proposal",
        "would like ability option configuration flag setting",
        "improvement suggestion idea roadmap milestone",
    ],
    "Security": [
        "security vulnerability exploit injection xss csrf authentication",
        "authorization privilege escalation sensitive data exposure",
        "cve patch advisory disclosure responsible",
    ],
    "Testing": [
        "test testing unit integration e2e coverage flaky passing failing",
        "mock stub assertion expect spec suite runner playwright cypress",
        "regression test automation ci pipeline",
    ],
}

# Label keywords that strongly indicate category
LABEL_HINTS = {
    "bug": "Bug", "regression": "Bug", "crash": "Bug", "error": "Bug",
    "documentation": "Documentation", "docs": "Documentation",
    "enhancement": "Feature Request", "feature": "Feature Request", "proposal": "Feature Request",
    "security": "Security", "vulnerability": "Security", "cve": "Security",
    "testing": "Testing", "test": "Testing", "coverage": "Testing",
}


def _preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'```[\s\S]*?```', ' code_block ', text)
    text = re.sub(r'https?://\S+', ' url_link ', text)
    text = re.sub(r'[^a-z0-9\s_]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def _build_seed_corpus():
    texts, labels = [], []
    for cat, sentences in CATEGORY_SEEDS.items():
        idx = ISSUE_CATEGORIES.index(cat)
        for sent in sentences:
            # Augment each seed sentence a few times
            for _ in range(40):
                texts.append(sent)
                labels.append(idx)
    return texts, labels


class IssueClusteringModel:
    def __init__(self):
        MODELS_DIR.mkdir(exist_ok=True)
        self.vectorizer = TfidfVectorizer(
            max_features=2000, ngram_range=(1, 2),
            sublinear_tf=True, min_df=1,
        )
        self.kmeans = None
        self._cluster_labels: List[str] = []
        self._load_or_train()

    def _load_or_train(self):
        km_path = MODELS_DIR / "issue_kmeans.pkl"
        vec_path = MODELS_DIR / "issue_tfidf.pkl"
        labels_path = MODELS_DIR / "issue_cluster_labels.pkl"

        if km_path.exists():
            self.kmeans = joblib.load(km_path)
            self.vectorizer = joblib.load(vec_path)
            self._cluster_labels = joblib.load(labels_path)
            logger.info("Loaded issue clustering model from disk.")
        else:
            self._train(km_path, vec_path, labels_path)

    def _train(self, km_path, vec_path, labels_path):
        logger.info("Training issue clustering model...")
        texts, y = _build_seed_corpus()
        X = self.vectorizer.fit_transform(texts)
        X_norm = normalize(X)

        self.kmeans = KMeans(n_clusters=N_CLUSTERS, n_init=20, random_state=42)
        self.kmeans.fit(X_norm)

        # Map cluster IDs to category labels by majority vote
        from collections import Counter
        label_map = {}
        for cid in range(N_CLUSTERS):
            mask = self.kmeans.labels_ == cid
            labels_in_cluster = [y[i] for i, m in enumerate(mask) if m]
            majority = Counter(labels_in_cluster).most_common(1)[0][0]
            label_map[cid] = ISSUE_CATEGORIES[majority]
        self._cluster_labels = [label_map[i] for i in range(N_CLUSTERS)]

        joblib.dump(self.kmeans, km_path)
        joblib.dump(self.vectorizer, vec_path)
        joblib.dump(self._cluster_labels, labels_path)
        logger.info("Issue clustering model trained and saved.")

    def _label_hint(self, labels: List[str]) -> str | None:
        for lbl in labels:
            hint = LABEL_HINTS.get(lbl.lower())
            if hint:
                return hint
        return None

    def _predict_single(self, req: IssueClusterRequest) -> dict:
        text = _preprocess_text(f"{req.title} {req.body or ''}")
        vec = self.vectorizer.transform([text])
        vec_norm = normalize(vec)

        cluster_id = int(self.kmeans.predict(vec_norm)[0])

        # Compute soft probabilities via inverse distances
        # vec_norm is sparse; convert to dense before subtracting dense cluster centers
        vec_dense = vec_norm.toarray()
        distances = np.array([
            np.linalg.norm(vec_dense - self.kmeans.cluster_centers_[i])
            for i in range(N_CLUSTERS)
        ])
        scores = 1 / (1 + distances)
        proba = scores / scores.sum()

        predicted_cat = self._cluster_labels[cluster_id]
        label_override = self._label_hint(req.labels or [])

        # If label strongly hints a category, boost its confidence
        if label_override and label_override != predicted_cat:
            override_idx = [self._cluster_labels[i] for i in range(N_CLUSTERS)].index(label_override) if label_override in self._cluster_labels else None
            if override_idx is not None:
                proba[override_idx] += 0.25
                proba = proba / proba.sum()
                cluster_id = int(np.argmax(proba))
                predicted_cat = self._cluster_labels[cluster_id]

        return {
            "issue_id": req.issue_id,
            "category": predicted_cat,
            "confidence": round(float(proba[cluster_id]), 4),
            "probabilities": {
                self._cluster_labels[i]: round(float(proba[i]), 4)
                for i in range(N_CLUSTERS)
            },
        }

    def predict(self, req: IssueClusterRequest) -> dict:
        return self._predict_single(req)

    def predict_batch(self, issues: List[IssueClusterRequest]) -> list:
        return [self._predict_single(i) for i in issues]
