const filesInput = document.getElementById('files-input');
const previewContainer = document.getElementById('canvas-area');
const btnProcess = document.getElementById('btn-process');
const fileReader = new FileReader();
let pageCounter = 0;

let pdfFile = null;
let pdfDoc = null;

fileReader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    pdfDoc = await pdfjsLib.getDocument({ data: typedarray }).promise;

    previewContainer.innerHTML = ''; // Limpiar anteriores
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        pageCounter++;
        const page = await pdfDoc.getPage(i);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 0.4 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const wrapper = document.createElement('div');
        wrapper.classList.add('page-preview');
        wrapper.dataset.pageNumber = pageCounter;

        // Agrega el número visible en la esquina
        const numberLabel = document.createElement('div');
        numberLabel.classList.add('page-preview-number');
        numberLabel.innerText = `#${pageCounter}`;
        wrapper.appendChild(numberLabel);

        wrapper.appendChild(canvas);

        previewContainer.appendChild(wrapper);
    }

    // Activar ordenamiento con SortableJS
    Sortable.create(previewContainer, {
        animation: 150
    });
};

// Cargar PDF y renderizar páginas
filesInput.addEventListener('change', async (e) => {

    for(let i = 0; i < e.target.files.length; i++){
        let file = e.target.files[i];
        console.log(file);
        if (!file || file.type !== 'application/pdf') return;

        pdfFile = file;

        fileReader.readAsArrayBuffer(file);
    }

    pageCounter = 0;
    
});

// Enviar al backend
btnProcess.addEventListener('click', async () => {
    if (!pdfFile) return alert('Primero carga un archivo PDF.');

    const pageOrder = Array.from(document.querySelectorAll('.page-preview'))
        .map(div => parseInt(div.dataset.pageNumber));

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('order', JSON.stringify(pageOrder));

    const response = await fetch('/merge', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } else {
        alert('Error al unir el PDF.');
    }
});