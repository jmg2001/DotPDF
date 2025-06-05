const filesInput = document.getElementById('files-input');
const previewContainer = document.getElementById('canvas-area');
const btnProcess = document.getElementById('btn-process');
let pageCounter = 0;
let fileCounter = 0;

let filesArray = Array();

let sessionId = null;

// Llama esta función cuando cargue la página
window.onload = getSessionId;

async function getSessionId() {
    try {
        const response = await fetch('/session');
        const data = await response.json();
        sessionId = data.session_id;

        // También puedes guardarlo en localStorage si quieres persistencia entre recargas
        localStorage.setItem('session_id', sessionId);

        console.log("Session ID:", sessionId);
    } catch (err) {
        console.error("Error obtaining session ID:", err);
        sessionId = -1;
    }
}


// Cargar PDF y renderizar páginas
filesInput.addEventListener('change', async (e) => {

    if (pageCounter == 0) previewContainer.innerHTML = '';  // Limpiar previas anteriores

    const files = Array.from(filesInput.files);

    console.log(files);

    for (let i = 0; i < files.length; i++) {
        fileCounter++;

        const file = files[i];
        filesArray.push(file);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            pageCounter++;

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const wrapper = document.createElement('div');
            wrapper.classList.add('page-preview');
            wrapper.dataset.pageNumber = pageCounter;
            wrapper.dataset.fileIndex = fileCounter;

            const numberLabel = document.createElement('div');
            numberLabel.classList.add('page-preview-number');
            numberLabel.innerText = `${pageCounter}`;
            wrapper.appendChild(numberLabel);
            wrapper.appendChild(canvas);

            previewContainer.appendChild(wrapper);
        }
    }

    // Habilitar drag & drop
    new Sortable(previewContainer, {
        animation: 150,
        ghostClass: 'dragging'
    });
});

// Enviar al backend
btnProcess.addEventListener('click', async () => {

    if (pageCounter == 0) return alert('Primero carga un archivo PDF.');

    pageCounter = 0;
    fileCounter = 0;

    const pageOrder = Array.from(document.querySelectorAll('.page-preview'))
        .map(div => parseInt(div.dataset.pageNumber));

    console.log(filesArray);
    console.log(pageOrder);

    const formData = new FormData();

    for(let i = 0; i < filesArray.length; i++){
        formData.append('files', filesArray[i]);
    }

    formData.append('order', JSON.stringify(pageOrder));
    formData.append('session_id',sessionId);

    fetch("/organize", {
        method: "POST",
        body: formData,  // Tu FormData con los datos necesarios
    })
    .then(response => {
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "res.pdf";  // Nombre del archivo
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        // Reiniciar archivos e interfaz
        filesInput.value = "";
        previewContainer.innerHTML = ''
        files = new Array();
    })
    .catch(error => {
        console.error("Download Error:", error);
        alert("Hubo un error al descargar el archivo PDF. Por favor, inténtalo de nuevo.");
    });

    // filesInput.
    
});