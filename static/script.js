const filesInput = document.getElementById('files-input');
const previewContainer = document.getElementById('canvas-area');
const btnProcess = document.getElementById('btn-process');
let pageCounter = 0;
let fileCounter = 0;

let filesArray = Array();

// Cargar PDF y renderizar páginas
filesInput.addEventListener('change', async (e) => {

    if (pageCounter == 0) previewContainer.innerHTML = '';  // Limpiar previas anteriores

    const files = Array.from(filesInput.files);

    for (let i = 0; i < files.length; i++) {
        fileCounter++;

        const file = files[i];
        filesArray.push(file);
        // const label = document.createElement('h3');
        // label.textContent = `Archivo ${i + 1}: ${file.name}`;
        // previewContainer.appendChild(label);

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
            numberLabel.innerText = `#${pageCounter}`;
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

    previewContainer.innerHTML = ''
    files = new Array();
});