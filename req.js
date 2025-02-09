const formData = new FormData();
formData.append('file', fileInput.files[0]);  // `fileInput` este un element <input type="file">

fetch('https://numele-aplicatiei.herokuapp.com/convert', {
    method: 'POST',
    body: formData
})
.then(response => response.blob())
.then(data => {
    // Aici poți salva imaginea PNG sau o poți arăta pe site
    const imageURL = URL.createObjectURL(data);
    document.getElementById('image-preview').src = imageURL;  // `image-preview` este un element <img>
})
.catch(error => console.error('Error:', error));
