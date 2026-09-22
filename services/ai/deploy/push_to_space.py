"""
What it does:  Uploads exactly the files the Docker image needs to a Hugging Face Space, which then builds and runs it.
Concept:       A public Space shows its files to anyone, not only the running app. So we upload an ALLOWLIST:
               the Dockerfile, the dependencies, and the server's code. Everything else stays on your PC:
               .env (secrets), data/ (private PDFs), evaluation/ (questions and answers drawn from those PDFs),
               tests, and git history.
Why this design: An allowlist fails safe. A new file is private until someone adds it here on purpose, whereas
               pushing the folder with git (`git subtree push`) would publish every tracked file and its history.
Inputs/Outputs: A Space id like "your-name/vietcorner-ai" -> one commit on the Space (it rebuilds on its own).
Run:           python -m deploy.push_to_space your-name/vietcorner-ai --dry-run   (list the files, upload nothing)
               python -m deploy.push_to_space your-name/vietcorner-ai
               Log in once first with `hf auth login` (it asks for a Hugging Face token with write access).
Common pitfalls:
  - Adding a module the server imports without adding it here: the Space build succeeds, then the app crashes
    at startup with ModuleNotFoundError. Check the Space's logs after each new file.
  - Putting secrets in the Space's files. They go in Settings -> Variables and secrets, never in an upload.
"""

import sys

from huggingface_hub import HfApi
from huggingface_hub.utils import filter_repo_objects

from config import SERVICE_ROOT

# Everything the image needs, and nothing else. Patterns are relative to services/ai ("*" also matches "/").
FILES_THE_IMAGE_NEEDS = [
    "Dockerfile",
    ".dockerignore",
    "README.md",  # its front matter tells the Space to build with Docker, on port 8000
    "requirements.txt",
    "config.py",
    "domain.py",
    "api/*.py",
    "rag/*.py",
    "speech/*.py",
]
# Remove server code the Space still has from an earlier upload (a renamed or deleted module).
STALE_FILES = ["*.py"]


def files_to_upload() -> list[str]:
    """The local paths the allowlist matches, so a dry run shows exactly what would become public."""
    local = [path.relative_to(SERVICE_ROOT).as_posix() for path in SERVICE_ROOT.rglob("*") if path.is_file()]
    return sorted(filter_repo_objects(local, allow_patterns=FILES_THE_IMAGE_NEEDS))


def main(argv: list[str]) -> None:
    if not argv:
        print("Usage: python -m deploy.push_to_space <your-name>/<space-name> [--dry-run]")
        return

    space_id = argv[0]
    files = files_to_upload()
    print(f"{len(files)} files for {space_id}:")
    for path in files:
        print(f"  {path}")

    if "--dry-run" in argv:
        print("Dry run: nothing uploaded.")
        return

    commit = HfApi().upload_folder(
        repo_id=space_id,
        repo_type="space",
        folder_path=SERVICE_ROOT,
        allow_patterns=FILES_THE_IMAGE_NEEDS,
        delete_patterns=STALE_FILES,
        commit_message="Deploy the VietCorner AI service",
    )
    print(f"Uploaded. The Space is rebuilding: {commit.commit_url}")


if __name__ == "__main__":
    main(sys.argv[1:])
