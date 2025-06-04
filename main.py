from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import shutil
from pypdf import PdfReader, PdfWriter

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/", response_class=HTMLResponse)
async def get_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/merge")
async def merge_pdfs(request: Request, files: list[UploadFile] = File(...)):
    file_paths = []
    print(files)
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_paths.append(file_path)
    return file_paths
    # return templates.TemplateResponse("reorder.html", {"request": request, "files": file_paths})

@app.post("/finalize")
async def finalize_merge(request: Request, order: str = Form(...)):
    page_order = eval(order)  # Espera lista de tuplas: [(filepath, page_num), ...]
    writer = PdfWriter()

    for item in page_order:
        file_path, page_num = item
        reader = PdfReader(file_path)
        writer.add_page(reader.pages[page_num])

    output_path = os.path.join(UPLOAD_DIR, "merged.pdf")
    with open(output_path, "wb") as f:
        writer.write(f)
    
    return FileResponse(output_path, filename="merged.pdf")
