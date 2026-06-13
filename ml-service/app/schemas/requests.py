from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class IssueDifficultyRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    labels: List[str] = []
    num_comments: int = 0
    repo_stars: int = 0
    repo_size: int = 0


class ContributionRequest(BaseModel):
    user_skills: List[str]
    previous_contributions: int = 0
    repo_category: str = "Full Stack"
    issue_difficulty: str = "Medium"


class RepoClusterRequest(BaseModel):
    repo_id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    topics: List[str] = []
    languages: Dict[str, float] = {}
    stars: int = 0
    size: int = 0
    open_issues: int = 0


class BatchRepoClusterRequest(BaseModel):
    repositories: List[RepoClusterRequest]


class IssueClusterRequest(BaseModel):
    issue_id: Optional[str] = None
    title: str
    body: Optional[str] = ""
    labels: List[str] = []


class BatchIssueClusterRequest(BaseModel):
    issues: List[IssueClusterRequest]


class RepoExplainerRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    topics: List[str] = []
    languages: Dict[str, float] = {}
    readme: Optional[str] = ""
    file_tree: Optional[List[str]] = []
    stars: int = 0
    forks: int = 0


class RecommendationRequest(BaseModel):
    user_skills: List[str]
    contribution_count: int = 0
    preferred_languages: List[str] = []
    repositories: List[Dict[str, Any]] = []
    issues: List[Dict[str, Any]] = []
