"""Run this script to pre-train and save all models before starting the server."""
import logging
import sys
from pathlib import Path

# Ensure project root is on path when run directly
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(message)s")
logger = logging.getLogger(__name__)


def main():
    from app.models.issue_difficulty import IssueDifficultyModel
    from app.models.contribution_success import ContributionSuccessModel
    from app.models.repo_clustering import RepoClusteringModel
    from app.models.issue_clustering import IssueClusteringModel

    logger.info("=== Training Issue Difficulty Model ===")
    IssueDifficultyModel()

    logger.info("=== Training Contribution Success Model ===")
    ContributionSuccessModel()

    logger.info("=== Training Repository Clustering Model ===")
    RepoClusteringModel()

    logger.info("=== Training Issue Clustering Model ===")
    IssueClusteringModel()

    logger.info("All models trained and saved to ./saved_models/")


if __name__ == "__main__":
    main()
