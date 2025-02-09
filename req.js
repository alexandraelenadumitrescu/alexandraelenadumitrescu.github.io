// Ascultă submit-ul formularului
document.getElementById('pdfForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Previne reîncărcarea paginii

    // Obține fișierul PDF selectat
    const pdfFile = document.getElementById('pdfFile').files[0];

    // Creează un obiect FormData pentru a trimite fișierul
    const formData = new FormData();
    formData.append('file', pdfFile);

    // Trimite cererea POST către server
    fetch('http://127.0.0.1:5000/convert', {
        method: 'POST',
        body: formData
    })
    .then(response => response.blob()) // Convertește răspunsul în Blob
    .then(imageBlob => {
        // Creează un URL temporar pentru imagine
        const imageURL = URL.createObjectURL(imageBlob);
        // Afișează imaginea
        document.getElementById('convertedImage').src = imageURL;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
