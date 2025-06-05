import os, time, shutil, threading
import logging

logger = logging.getLogger("uvicorn")

UPLOADS_DIR = "uploads/"
RESULTS_DIR = "results/"
MAX_AGE_UPLOADS = 60  # s
MAX_AGE_RESULTS = 120  # s
INTERVAL_CLEANER = 30 # s

def session_cleaner():
    while True:
        now = time.time()
        for folder in os.listdir(UPLOADS_DIR):
            path = os.path.join(UPLOADS_DIR, folder)
            if os.path.isdir(path):
                last_modified = os.path.getmtime(path)
                if now - last_modified > MAX_AGE_UPLOADS:
                    shutil.rmtree(path)
                    logger.info(f"Session {folder} - Uploads - CLEANED")
                    
        for folder in os.listdir(RESULTS_DIR):
            path = os.path.join(RESULTS_DIR, folder)
            if os.path.isdir(path):
                last_modified = os.path.getmtime(path)
                if now - last_modified > MAX_AGE_RESULTS:
                    shutil.rmtree(path)
                    logger.info(f"Session {folder} - Results - CLEANED")
        time.sleep(INTERVAL_CLEANER)

def start_session_cleaner():
    thread = threading.Thread(target=session_cleaner, daemon=True)
    thread.start()