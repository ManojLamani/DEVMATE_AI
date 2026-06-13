import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.issue_difficulty import IssueDifficultyModel
from app.models.contribution_success import ContributionSuccessModel
from app.models.repo_clustering import RepoClusteringModel
from app.models.issue_clustering import IssueClusteringModel
from app.models.repo_explainer import RepoExplainer
from app.models.recommendation import RecommendationEngine
from app.schemas.requests import (
    IssueDifficultyRequest, ContributionRequest,
    RepoClusterRequest, BatchRepoClusterRequest,
    IssueClusterRequest, BatchIssueClusterRequest,
    RepoExplainerRequest, RecommendationRequest,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_models: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading ML models...")
    _models['issue_difficulty'] = IssueDifficultyModel()
    _models['contribution_success'] = ContributionSuccessModel()
    _models['repo_clustering'] = RepoClusteringModel()
    _models['issue_clustering'] = IssueClusteringModel()
    _models['repo_explainer'] = RepoExplainer()
    _models['recommendation'] = RecommendationEngine()
    logger.info("All models ready.")
    yield
    _models.clear()


app = FastAPI(title="DevMate ML Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "models": list(_models.keys())}


# Module 1 — Issue Difficulty
@app.post("/predict/issue-difficulty")
async def predict_issue_difficulty(req: IssueDifficultyRequest):
    return {"success": True, "data": _models['issue_difficulty'].predict(req)}


# Module 2 — Contribution Success
@app.post("/predict/contribution-success")
async def predict_contribution_success(req: ContributionRequest):
    return {"success": True, "data": _models['contribution_success'].predict(req)}


# Module 3 — Repository Clustering (single + batch)
@app.post("/cluster/repository")
async def cluster_repository(req: RepoClusterRequest):
    return {"success": True, "data": _models['repo_clustering'].predict(req)}


@app.post("/cluster/repositories")
async def cluster_repositories(req: BatchRepoClusterRequest):
    return {"success": True, "data": _models['repo_clustering'].predict_batch(req.repositories)}


@app.get("/cluster/visualization")
async def cluster_visualization():
    return {"success": True, "data": _models['repo_clustering'].get_visualization_data()}


# Module 4 — Issue Clustering (single + batch)
@app.post("/cluster/issue")
async def cluster_issue(req: IssueClusterRequest):
    return {"success": True, "data": _models['issue_clustering'].predict(req)}


@app.post("/cluster/issues")
async def cluster_issues(req: BatchIssueClusterRequest):
    return {"success": True, "data": _models['issue_clustering'].predict_batch(req.issues)}


# Module 5 — Repository Explainer
@app.post("/explain/repository")
async def explain_repository(req: RepoExplainerRequest):
    result = await _models['repo_explainer'].explain(req)
    return {"success": True, "data": result}


# Module 6 — Developer Recommendations
@app.post("/recommend")
async def get_recommendations(req: RecommendationRequest):
    return {"success": True, "data": _models['recommendation'].recommend(req)}
