import numpy as np
import re

COMPLEXITY_LABELS = {
    'security': 3.0, 'vulnerability': 3.0, 'critical': 3.0,
    'bug': 2.0, 'regression': 2.5, 'performance': 2.0,
    'enhancement': 1.5, 'feature': 1.5, 'refactor': 1.5,
    'documentation': 1.0, 'docs': 1.0, 'question': 0.5,
    'help wanted': 1.0, 'good first issue': 0.5, 'wontfix': 1.0,
    'duplicate': 0.5, 'invalid': 0.5,
}

SKILL_CATEGORIES = {
    'frontend': ['javascript', 'typescript', 'react', 'vue', 'angular', 'css', 'html', 'next.js', 'svelte', 'tailwind'],
    'backend': ['python', 'java', 'go', 'rust', 'node.js', 'express', 'django', 'flask', 'spring', 'rails', 'fastapi'],
    'database': ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'prisma', 'sqlite', 'cassandra'],
    'devops': ['docker', 'kubernetes', 'ci/cd', 'aws', 'gcp', 'azure', 'terraform', 'ansible', 'jenkins'],
    'ml': ['machine learning', 'pytorch', 'tensorflow', 'scikit-learn', 'nlp', 'deep learning', 'pandas', 'numpy'],
    'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios', 'expo'],
}

REPO_CATEGORIES = ['Frontend', 'Backend', 'Full Stack', 'AI/ML', 'DevOps', 'Cloud']
DIFFICULTY_MAP = {'Easy': 0, 'Medium': 1, 'Hard': 2}

ALL_LANGUAGES = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
    'Ruby', 'PHP', 'C#', 'C++', 'Swift', 'Kotlin', 'Shell',
    'HTML', 'CSS', 'R', 'Scala', 'Dockerfile', 'HCL',
]

LANGUAGE_CLUSTER_WEIGHTS = {
    'Frontend': ['JavaScript', 'TypeScript', 'HTML', 'CSS'],
    'Backend': ['Python', 'Java', 'Go', 'Ruby', 'PHP', 'Rust', 'C#', 'C++', 'Scala'],
    'AI/ML': ['Python', 'R', 'Scala'],
    'DevOps': ['Shell', 'Dockerfile', 'HCL'],
    'Cloud': ['TypeScript', 'Python', 'Go', 'HCL'],
    'Full Stack': ['JavaScript', 'TypeScript', 'Python'],
}

TOPIC_KEYWORDS = {
    'Frontend': ['frontend', 'ui', 'web', 'react', 'vue', 'angular', 'css', 'tailwind', 'nextjs'],
    'Backend': ['backend', 'api', 'server', 'microservice', 'rest', 'graphql', 'grpc', 'express'],
    'AI/ML': ['machine-learning', 'ai', 'deep-learning', 'nlp', 'neural', 'data', 'ml', 'llm'],
    'DevOps': ['devops', 'ci', 'cd', 'docker', 'kubernetes', 'k8s', 'helm', 'pipeline'],
    'Cloud': ['cloud', 'aws', 'gcp', 'azure', 'serverless', 'lambda', 'infrastructure'],
    'Full Stack': ['fullstack', 'full-stack', 'mern', 'mean', 'nextjs', 'monorepo'],
}


def extract_issue_features(title: str, description: str, labels: list,
                           num_comments: int, repo_stars: int, repo_size: int) -> np.ndarray:
    title_len = len(title)
    desc_len = len(description or "")
    num_labels = len(labels)
    desc_lower = (description or "").lower()
    has_code = 1 if "```" in (description or "") else 0
    has_stacktrace = 1 if any(k in desc_lower for k in ["error:", "exception:", "traceback", "stack trace"]) else 0
    label_complexity = (
        sum(COMPLEXITY_LABELS.get(l.lower(), 1.0) for l in labels) / max(1, len(labels))
    )
    word_count = len(title.split()) + len((description or "").split())
    url_count = len(re.findall(r'https?://', description or ""))

    return np.array([
        title_len, desc_len, num_labels, num_comments,
        np.log1p(repo_stars), np.log1p(repo_size),
        has_code, has_stacktrace, label_complexity,
        word_count, url_count,
    ], dtype=np.float64)


def extract_contribution_features(user_skills: list, previous_contributions: int,
                                   repo_category: str, issue_difficulty: str) -> np.ndarray:
    skill_lower = [s.lower() for s in user_skills]
    category_scores = {
        cat: sum(1 for s in skill_lower if s in skills) / max(1, len(skills))
        for cat, skills in SKILL_CATEGORIES.items()
    }

    repo_cat_idx = REPO_CATEGORIES.index(repo_category) if repo_category in REPO_CATEGORIES else 0
    repo_cat_onehot = np.zeros(len(REPO_CATEGORIES))
    repo_cat_onehot[repo_cat_idx] = 1.0

    difficulty_val = float(DIFFICULTY_MAP.get(issue_difficulty, 1))

    return np.array([
        len(user_skills),
        category_scores['frontend'], category_scores['backend'],
        category_scores['database'], category_scores['devops'],
        category_scores['ml'], category_scores['mobile'],
        np.log1p(previous_contributions),
        difficulty_val,
        *repo_cat_onehot,
    ], dtype=np.float64)


def extract_repo_features(name: str, description: str, topics: list,
                          languages: dict, stars: int, size: int, open_issues: int) -> np.ndarray:
    text = f"{name} {description or ''} {' '.join(topics)}".lower()
    total_bytes = max(sum(languages.values()), 1)

    lang_vec = np.zeros(len(ALL_LANGUAGES))
    for lang, val in languages.items():
        if lang in ALL_LANGUAGES:
            lang_vec[ALL_LANGUAGES.index(lang)] = val / total_bytes

    cluster_lang_scores = [
        sum(languages.get(l, 0) for l in LANGUAGE_CLUSTER_WEIGHTS[c]) / total_bytes
        for c in REPO_CATEGORIES
    ]

    topic_scores = [
        sum(1 for kw in TOPIC_KEYWORDS[c] if kw in text)
        for c in REPO_CATEGORIES
    ]

    return np.concatenate([
        lang_vec,
        cluster_lang_scores,
        topic_scores,
        [np.log1p(stars), np.log1p(size), np.log1p(open_issues)],
    ]).astype(np.float64)
