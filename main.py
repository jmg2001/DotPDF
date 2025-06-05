from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from utils import *
import json
from pypdf import PdfReader, PdfWriter
from uuid import uuid4

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

UPLOAD_DIR = "uploads"
RESULTS_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

@app.on_event("startup")
def on_startup():
    start_session_cleaner()

@app.get("/", response_class=HTMLResponse)
async def get_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/organize")
async def merge_pdfs(request: Request, files: list[UploadFile] = File(...), session_id: str = Form(...), order: str = Form(...)):
    file_paths = []
    file_names = []
    try:
        order = json.loads(order)
    except json.JSONDecodeError:
        return {'error':'Invalid Order Format'}
    session_path = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_path, exist_ok=True)

    for file in files:
        filepath = os.path.join(session_path, file.filename)
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
        file_paths.append(filepath)
        file_names.append(file.filename)
    
    page_index = 0
    pages = []
    
    writer = PdfWriter()
    
    for file in file_paths:
        reader = PdfReader(file)
        for page in reader.pages:
            page_index += 1
            if page_index in order:
                pages.append(page)
                
    for index in order:
        writer.add_page(pages[index-1])

    output_session_path = os.path.join(RESULTS_DIR,session_id)
    os.makedirs(output_session_path, exist_ok=True)
    output_session_path = os.path.join(output_session_path,"res.pdf")
    with open(output_session_path, "wb") as f:
        writer.write(f)
    
    return FileResponse(output_session_path, filename="res.pdf")

@app.post("/finalize")
async def finalize_merge(request: Request, order: str = Form(...)):
    return {'succes':'ok'}

@app.get("/session")
def get_session():
    id = str(uuid4())
    logger.info(f"Session {id} - ASSIGNED")
    return {"session_id": id}